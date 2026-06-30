output "amplify_app_id" {
  description = "Amplify app id (use with the AWS console / CLI)."
  value       = aws_amplify_app.web.id
}

output "amplify_default_domain" {
  description = "Default Amplify URL for the main branch — works immediately, before the custom domain verifies."
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.web.default_domain}"
}

output "web_url" {
  description = "Public URL once the custom domain verifies."
  value       = "https://${var.root_domain}"
}

output "amplify_console_url" {
  description = "Deep link to this app in the Amplify console (to authorize the GitHub App / watch builds)."
  value       = "https://${var.aws_region}.console.aws.amazon.com/amplify/apps/${aws_amplify_app.web.id}"
}
