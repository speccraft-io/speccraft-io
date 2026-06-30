# ---------------------------------------------------------------------------
# General
# ---------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-2"
}

variable "project" {
  description = "Short name used to name/tag resources."
  type        = string
  default     = "speccraft-io"
}

# ---------------------------------------------------------------------------
# DNS / domain  (you own speccraft.io; its hosted zone exists in Route 53)
# ---------------------------------------------------------------------------

variable "root_domain" {
  description = "Apex domain whose Route 53 hosted zone exists already. The site serves at the apex and at www.<root_domain>."
  type        = string
  default     = "speccraft.io"
}

# ---------------------------------------------------------------------------
# Amplify (frontend)
# ---------------------------------------------------------------------------

variable "github_repository" {
  description = "HTTPS URL of the GitHub repo Amplify builds from."
  type        = string
  default     = "https://github.com/speccraft-io/speccraft-io"
}

variable "amplify_branch" {
  description = "Git branch Amplify auto-builds."
  type        = string
  default     = "main"
}

# Required at first apply: a GitHub token with repo access so Amplify can
# connect the repo and register a push webhook. Pass it via the environment —
# never commit it:  export TF_VAR_github_access_token=$(gh auth token)
# (the gh CLI's OAuth token carries `repo` scope, which is sufficient).
# After creation, drift on this is ignored (amplify.tf lifecycle block), so you
# can later migrate the connection to the AWS Amplify GitHub App in the console.
variable "github_access_token" {
  description = "GitHub token (PAT or gh OAuth token) with repo scope. Pass via TF_VAR_github_access_token; never commit it."
  type        = string
  sensitive   = true
  default     = ""
}
