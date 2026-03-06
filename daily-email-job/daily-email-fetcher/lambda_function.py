import os
import json
import boto3
import requests
from datetime import datetime
from supabase import create_client, Client

# --- 1. Global Config ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
QUEUE_URL = os.environ.get("SQS_QUEUE_URL")
TEST_MODE = os.environ.get("TEST_MODE", "false").lower() == "true"

# --- 2. Initializations ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
sqs = boto3.client('sqs')

def get_fake_emails(user_id):
    """Generates 10 diverse test cases for the AI classifier."""
    return [
        {"id": "test_01", "body": "Thank you for applying to Google for the Software Engineer role! We received your application."},
        {"id": "test_02", "body": "Hi Aaron, we'd like to invite you for an interview at Meta for the Production Engineer position."},
        {"id": "test_03", "body": "Regretfully, Amazon will not be moving forward with your application for SDE1 at this time."},
        {"id": "test_04", "body": "Congratulations! We are pleased to offer you the Data Scientist role at NVIDIA. Details attached."},
        {"id": "test_05", "body": "Your weekly LinkedIn job alerts: 15 new Software Engineer roles in Lubbock, TX."},
        {"id": "test_06", "body": "Hey Aaron, want to grab lunch today? Let me know if you're free near campus."},
        {"id": "test_07", "body": "Update from Tesla: Your interview for the Firmware Intern role is confirmed for Friday at 10 AM."},
        {"id": "test_08", "body": "Netflix: Your subscription has been renewed. Thank you for being a member!"},
        {"id": "test_09", "body": "Application Received: Full-stack Developer at Stripe. We are reviewing your profile now."},
        {"id": "test_10", "body": "Hi, this is a recruiter from OpenAI. We saw your GitHub and want to chat about a Research Engineer role."}
    ]

def get_access_token(refresh_token):
    response = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token'
    })
    return response.json().get('access_token')

def handler(event, context):
    users_resp = supabase.table("users").select("id, email, refresh_token").not_.is_("refresh_token", "null").execute()
    users = users_resp.data
    
    print(f"Mode: {'TEST' if TEST_MODE else 'LIVE'}. Found {len(users)} users.")

    for user in users:
        try:
            if TEST_MODE:
                print(f"Injecting test emails for {user['email']}")
                messages = get_fake_emails(user['id'])
                for msg in messages:
                    payload = {
                        "email_body": msg['body'],
                        "source_email_id": msg['id'],
                        "user_id": user['id'],
                        "applied_date": datetime.now().strftime('%Y-%m-%d')
                    }
                    sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(payload))
                continue

            # LIVE MODE Logic
            access_token = get_access_token(user['refresh_token'])
            headers = {'Authorization': f'Bearer {access_token}'}
            msgs_resp = requests.get(f"https://www.googleapis.com/gmail/v1/users/me/messages?q=newer_than:1d", headers=headers).json()
            
            for msg_meta in msgs_resp.get('messages', []):
                msg_data = requests.get(f"https://www.googleapis.com/gmail/v1/users/me/messages/{msg_meta['id']}", headers=headers).json()
                payload = {
                    "email_body": msg_data.get('snippet', ''),
                    "source_email_id": msg_meta['id'],
                    "user_id": user['id'],
                    "applied_date": datetime.now().strftime('%Y-%m-%d')
                }
                sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(payload))
                
        except Exception as e:
            print(f"Error for user {user['email']}: {str(e)}")
            
    return {"statusCode": 200, "body": "Process complete"}