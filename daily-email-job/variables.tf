variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "supabase_url" {
  type = string
}

variable "supabase_key" {
  type      = string
  sensitive = true
}

variable "google_client_id" {
  type = string
}

variable "google_client_secret" {
  type      = string
  sensitive = true
}

variable "test_mode" {
  type      = string
  sensitive = true
}

variable "openrouter_api_key" {
  type      = string
  sensitive = true
}