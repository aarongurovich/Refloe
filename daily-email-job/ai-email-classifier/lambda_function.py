import os
import json
import requests
from supabase import create_client, Client

# --- 1. Global Config ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

# --- 2. Initializations ---
print(f"Initializing Classifier for Supabase: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def analyze_email_with_ai(email_body):
    print("Requesting AI analysis from OpenRouter...")
    prompt = f"""
    Analyze the following email and determine if it is a job application update.
    If it is, extract the details into a JSON object matching this schema exactly:
    {{
        "is_job_application": true/false,
        "company_name": "String (Required)",
        "job_title": "String",
        "role_type": "Full-time" | "Internship" | "Contract" | "Unknown",
        "status": "Applied" | "Interviewing" | "Rejected" | "Offer"
    }}
    Email Content: {email_body}
    """
    
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        },
        data=json.dumps({
            "model": "stepfun/step-3.5-flash:free",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        })
    )
    
    try:
        result = response.json()
        content = result['choices'][0]['message']['content']
        return json.loads(content)
    except Exception as e:
        print(f"AI Analysis failed: {str(e)}")
        return {"is_job_application": False}

def handler(event, context):
    records = event.get('Records', [])
    print(f"Processing batch of {len(records)} SQS records.")

    for record in records:
        try:
            payload = json.loads(record['body'])
            email_body = payload.get('email_body')
            user_id = payload.get('user_id')
            
            if not email_body or not user_id:
                continue

            ai_result = analyze_email_with_ai(email_body)

            if ai_result.get("is_job_application") and ai_result.get("company_name"):
                # Normalize role_type
                role_type = ai_result.get("role_type")
                if not role_type or role_type == "Unknown":
                    role_type = "Full-time"

                data = {
                    "user_id": user_id,
                    "company_name": ai_result.get("company_name"),
                    "job_title": ai_result.get("job_title"),
                    "role_type": role_type,
                    "status": ai_result.get("status", "Applied"),
                    "source_email_id": payload.get('source_email_id'),
                    "applied_date": payload.get('applied_date')
                }
                
                print(f"Inserting {data['company_name']} for User {user_id}")
                supabase.table("ai_classifications").insert(data).execute()
                
        except Exception as e:
            print(f"Error processing SQS record: {str(e)}")
            continue
            
    return {"statusCode": 200, "body": "Batch processing complete"}