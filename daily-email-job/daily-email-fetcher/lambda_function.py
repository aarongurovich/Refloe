import os
import json
import boto3
import requests
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client

# --- 1. Global Config ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
MICROSOFT_CLIENT_ID = os.environ.get("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET = os.environ.get("MICROSOFT_CLIENT_SECRET")
QUEUE_URL = os.environ.get("SQS_QUEUE_URL")       # For sending found emails to the classifier
USER_QUEUE_URL = os.environ.get("USER_QUEUE_URL") # For dispatching user scan tasks

# --- 2. Initializations ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
sqs = boto3.client('sqs')

def get_google_access_token(refresh_token):
    """Refreshes the Google OAuth access token."""
    try:
        response = requests.post('https://oauth2.googleapis.com/token', data={
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        })
        response.raise_for_status()
        return response.json().get('access_token')
    except Exception as e:
        print(f"Failed to refresh Google token: {e}")
        return None

def get_microsoft_access_token(refresh_token):
    """Refreshes the Microsoft/Outlook access token."""
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        'client_id': MICROSOFT_CLIENT_ID,
        'client_secret': MICROSOFT_CLIENT_SECRET,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token'
    }
    response = requests.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', headers=headers, data=data)
    return response.json().get('access_token')

def process_user_emails(user_id, is_debug=False):
    """Fetches and processes emails for a single user."""
    if is_debug:
        test_cases = ["Offer from Tech Corp", "Interview at Meta", "Regret from Amazon"]
        for i, text in enumerate(test_cases):
            payload = {
                "email_body": text,
                "source_email_id": f"test-{i}",
                "user_id": user_id,
                "applied_date": datetime.now().strftime('%Y-%m-%d')
            }
            sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(payload))
        return len(test_cases)

    try:
        user_resp = supabase.table("users").select("refresh_token, outlook_refresh_token, preferred_provider, scan_history_months").eq("id", user_id).single().execute()
        
        provider = user_resp.data.get('preferred_provider', 'google')
        months = user_resp.data.get('scan_history_months', 0) or 0
        messages_processed = 0
        MAX_EMAILS = 2000

        if provider == 'outlook':
            refresh_token = user_resp.data.get('outlook_refresh_token')
            if not refresh_token: return 0
            access_token = get_microsoft_access_token(refresh_token)
            if not access_token: return 0

            headers = {'Authorization': f'Bearer {access_token}'}
            past_date = datetime.now(timezone.utc) - timedelta(days=max(1, months*30))
            date_str = past_date.strftime("%Y-%m-%dT%H:%M:%SZ")
            graph_url = f"https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge {date_str}&$select=id,bodyPreview,receivedDateTime&$top=50"
            
            while graph_url and messages_processed < MAX_EMAILS:
                msgs_resp = requests.get(graph_url, headers=headers)
                msgs_resp.raise_for_status()
                data = msgs_resp.json()
                for msg_data in data.get('value', []):
                    raw_date = msg_data.get('receivedDateTime', '')
                    payload = {
                        "email_body": msg_data.get('bodyPreview', ''),
                        "source_email_id": msg_data.get('id'),
                        "user_id": user_id,
                        "applied_date": raw_date[:10] if raw_date else datetime.now().strftime('%Y-%m-%d')
                    }
                    sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(payload))
                    messages_processed += 1
                graph_url = data.get('@odata.nextLink')

        else:
            refresh_token = user_resp.data.get('refresh_token')
            if not refresh_token: return 0
            time_query = f"{months * 30}d" if months > 0 else "1d"
            gmail_q = f"newer_than:{time_query}"
            access_token = get_google_access_token(refresh_token)
            if not access_token: return 0

            headers = {'Authorization': f'Bearer {access_token}'}
            next_page_token = None
            while messages_processed < MAX_EMAILS:
                list_url = f"https://www.googleapis.com/gmail/v1/users/me/messages?q={gmail_q}&maxResults=100"
                if next_page_token: list_url += f"&pageToken={next_page_token}"
                msgs_resp = requests.get(list_url, headers=headers)
                msgs_resp.raise_for_status()
                data = msgs_resp.json()
                messages = data.get('messages', [])
                if not messages: break
                for msg_meta in messages:
                    msg_data = requests.get(f"https://www.googleapis.com/gmail/v1/users/me/messages/{msg_meta['id']}", headers=headers).json()
                    ms_timestamp = int(msg_data.get('internalDate', 0))
                    payload = {
                        "email_body": msg_data.get('snippet', ''),
                        "source_email_id": msg_meta['id'],
                        "user_id": user_id,
                        "applied_date": datetime.fromtimestamp(ms_timestamp / 1000.0).strftime('%Y-%m-%d') if ms_timestamp else datetime.now().strftime('%Y-%m-%d')
                    }
                    sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(payload))
                    messages_processed += 1
                next_page_token = data.get('nextPageToken')
                if not next_page_token: break

        # Reset the scan history months after processing
        if months > 0:
            supabase.table("users").update({"scan_history_months": 0}).eq("id", user_id).execute()
        return messages_processed

    except Exception as e:
        print(f"Error for user {user_id}: {e}")
        return 0

def handler(event, context):
    """
    Main entry point. Handles three scenarios:
    1. Queue-triggered: Process 1 specific user.
    2. URL/Direct-triggered: Process 1 specific user.
    3. Scheduled/Global: Dispatch all users to the queue.
    """
    # SCENARIO 1: Triggered by SQS User Queue (Individual Work)
    if "Records" in event:
        for record in event['Records']:
            try:
                payload = json.loads(record['body'])
                user_id = payload.get("user_id")
                if user_id:
                    print(f"SQS WORKER: Processing user {user_id}")
                    processed = process_user_emails(user_id)
                    return {"statusCode": 200, "body": f"User {user_id} processed: {processed} emails."}
            except Exception as e:
                print(f"Failed to parse SQS record: {e}")
        return {"statusCode": 400, "body": "No valid user_id in queue message."}

    # SCENARIO 2: Triggered by Direct URL/Body (Onboarding Scan)
    user_id = None
    is_debug = False
    if "body" in event and event["body"]:
        try:
            body_data = json.loads(event["body"])
            user_id = body_data.get("user_id")
            is_debug = body_data.get("debug") is True
        except: pass
    else:
        user_id = event.get("user_id")
        is_debug = event.get("debug") is True

    if user_id:
        print(f"DIRECT TRIGGER: Processing user {user_id}")
        processed = process_user_emails(user_id, is_debug)
        return {"statusCode": 200, "body": f"Processed {processed} emails for user {user_id}."}

    # SCENARIO 3: Scheduled Global Scan (CloudWatch) -> DISPATCHER MODE
    print("GLOBAL DISPATCHER: Fetching all users from Supabase.")
    users_resp = supabase.table("users").select("id").execute()
    
    count = 0
    for user in users_resp.data:
        sqs.send_message(
            QueueUrl=USER_QUEUE_URL,
            MessageBody=json.dumps({"user_id": user['id']})
        )
        count += 1
        
    return {
        "statusCode": 200, 
        "body": f"Dispatched {count} user scan tasks to SQS."
    }