# --- 1. Automated Zipping Logic ---
data "archive_file" "fetcher_zip" {
  type        = "zip"
  source_file = "${path.module}/daily-email-fetcher/lambda_function.py"
  output_path = "${path.module}/daily-email-fetcher.zip"
}

data "archive_file" "classifier_zip" {
  type        = "zip"
  source_file = "${path.module}/ai-email-classifier/lambda_function.py"
  output_path = "${path.module}/ai-email-classifier.zip"
}

# --- 2. Lambda Layer Definition ---
resource "aws_lambda_layer_version" "python_dependencies" {
  filename            = "${path.module}/layer.zip"
  layer_name          = "refloe_dependencies"
  compatible_runtimes = ["python3.10"]
  source_code_hash    = filebase64sha256("${path.module}/layer.zip")
}

# --- 3. Shared Environment Map ---
locals {
  common_env_vars = {
    SUPABASE_URL            = var.supabase_url
    SUPABASE_KEY            = var.supabase_key
    GOOGLE_CLIENT_ID        = var.google_client_id
    GOOGLE_CLIENT_SECRET    = var.google_client_secret
    MICROSOFT_CLIENT_ID     = var.microsoft_client_id
    MICROSOFT_CLIENT_SECRET = var.microsoft_client_secret
  }
}

# --- 4. SQS Infrastructure ---
# Triggered by CloudWatch; feeds the Fetcher for individual user processing
resource "aws_sqs_queue" "user_scan_queue" {
  name                       = "user-scan-queue"
  visibility_timeout_seconds = 900 # Matches Fetcher timeout
}

# Triggered by the Fetcher; feeds the Classifier for AI extraction
resource "aws_sqs_queue" "email_queue" {
  name                       = "email-processing-queue"
  message_retention_seconds  = 86400 
  visibility_timeout_seconds = 90 # Classifier timeout is 60s
}

# --- 5. Sender Lambda (Daily Email Fetcher / Dispatcher) ---
resource "aws_lambda_function" "email_fetcher" {
  function_name = "daily-email-fetcher"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "lambda_function.handler"
  runtime       = "python3.10"
  timeout       = 900 # Increased to 15 minutes for deep scans

  filename         = data.archive_file.fetcher_zip.output_path
  source_code_hash = data.archive_file.fetcher_zip.output_base64sha256

  layers = [aws_lambda_layer_version.python_dependencies.arn]

  environment {
    variables = merge(local.common_env_vars, {
      SQS_QUEUE_URL  = aws_sqs_queue.email_queue.id
      USER_QUEUE_URL = aws_sqs_queue.user_scan_queue.id # New dispatcher queue
    })
  }
}

# --- 6. Classifier Lambda (AI Email Classifier) ---
resource "aws_lambda_function" "email_classifier" {
  function_name = "ai-email-classifier"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "lambda_function.handler"
  runtime       = "python3.10"
  timeout       = 60 

  filename         = data.archive_file.classifier_zip.output_path
  source_code_hash = data.archive_file.classifier_zip.output_base64sha256

  layers = [aws_lambda_layer_version.python_dependencies.arn]

  environment {
    variables = merge(local.common_env_vars, {
      OPENROUTER_API_KEY = var.openrouter_api_key
    })
  }
}

# --- 7. SQS Event Source Mappings ---
# User Queue triggers Fetcher to scan 1 user at a time
resource "aws_lambda_event_source_mapping" "user_trigger" {
  event_source_arn = aws_sqs_queue.user_scan_queue.arn
  function_name    = aws_lambda_function.email_fetcher.arn
  batch_size       = 1 
}

# Email Queue triggers Classifier to analyze emails
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.email_queue.arn
  function_name    = aws_lambda_function.email_classifier.arn
  batch_size       = 10
}

# --- 8. CloudWatch Schedule (Global Dispatcher) ---
resource "aws_cloudwatch_event_rule" "daily_cron" {
  name                = "daily-email-scan-schedule"
  schedule_expression = "cron(59 23 * * ? *)" # 11:59 PM UTC
}

resource "aws_cloudwatch_event_target" "trigger_fetcher" {
  rule      = aws_cloudwatch_event_rule.daily_cron.name
  target_id = "TriggerEmailFetcher"
  arn       = aws_lambda_function.email_fetcher.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_fetcher.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_cron.arn
}

# --- 9. IAM Role & Policies ---
resource "aws_iam_role" "lambda_exec" {
  name = "refloe_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "sqs_access" {
  name = "lambda_sqs_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Effect   = "Allow"
        Resource = [
          aws_sqs_queue.email_queue.arn,
          aws_sqs_queue.user_scan_queue.arn # Permission for both queues
        ]
      }
    ]
  })
}

# --- 10. Supabase Invocation Infrastructure ---
resource "aws_lambda_function_url" "fetcher_url" {
  function_name      = aws_lambda_function.email_fetcher.function_name 
  authorization_type = "AWS_IAM" # Protected by IAM keys
}

resource "aws_iam_user" "supabase_invoker" {
  name = "refloe-supabase-invoker"
}

resource "aws_iam_access_key" "supabase_keys" {
  user = aws_iam_user.supabase_invoker.name
}

resource "aws_iam_user_policy" "invoke_lambda" {
  name = "refloe-invoke-lambda-policy"
  user = aws_iam_user.supabase_invoker.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "lambda:InvokeFunctionUrl"
        Effect   = "Allow"
        Resource = aws_lambda_function.email_fetcher.arn
      }
    ]
  })
}

# --- 11. Outputs ---
output "lambda_fetcher_url" {
  value = aws_lambda_function_url.fetcher_url.function_url
}

output "supabase_aws_access_key" {
  value = aws_iam_access_key.supabase_keys.id
}

output "supabase_aws_secret_key" {
  value     = aws_iam_access_key.supabase_keys.secret
  sensitive = true # Masked to resolve Terraform plan errors
}