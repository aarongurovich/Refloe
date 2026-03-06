# Refloe (Trackr)

Refloe is an AI-powered job application tracker that puts your search on autopilot. By connecting to your Gmail, it uses AI to scan your inbox, detect job updates, and automatically build a visual pipeline of your applications.

## 🚀 Features

* **Automated Email Scanning**: Connects to the Gmail API to scan for job-related emails from the last 24 hours.
* **AI-Powered Extraction**: Uses the OpenRouter API (Step-3.5-flash model) to analyze email content and extract company names, job titles, role types, and application status.
* **Visual Pipeline**: A React-based dashboard to view your job applications' journey from "Applied" to "Offer".
* **Real-time Updates**: Built with Supabase to provide instant updates to your dashboard via PostgreSQL changes.
* **Serverless Infrastructure**: Utilizes AWS Lambda and SQS for daily background processing, scheduled via CloudWatch.

## 🛠️ Tech Stack

* **Frontend**: React + Vite
* **Backend/Database**: Supabase (Auth, Database, Edge Functions)
* **AI Engine**: OpenRouter
* **Cloud Infrastructure**: AWS (Lambda, SQS, CloudWatch) managed via Terraform
* **Language**: Python (Lambdas) and JavaScript/JSX (Frontend)

## 🏗️ Project Structure

* `/src`: React frontend source code.
* `/daily-email-job`: AWS Lambda functions and Terraform configuration.
    * `daily-email-fetcher`: Fetches emails from Gmail using OAuth tokens.
    * `ai-email-classifier`: Processes emails via AI and stores results in Supabase.
* `/supabase`: Configuration and Edge Functions for handling authentication.

## ⚙️ Configuration & Setup

### Environment Variables
You will need to set up the following environment variables:

**Frontend (.env):**
* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`
* `VITE_GOOGLE_CLIENT_ID`

**AWS Lambda/Terraform (variables.tf):**
* `supabase_url`
* `supabase_key`
* `google_client_id`
* `google_client_secret`
* `openrouter_api_key`

### Deployment
The backend infrastructure is automated using Terraform:
1.  Navigate to the `daily-email-job` directory.
2.  Initialize and apply:
    ```bash
    terraform init
    terraform apply
    ```
This sets up a CloudWatch rule that triggers the email scan daily at 11:59 PM UTC.

---
*Generated based on the Refloe project codebase.*
