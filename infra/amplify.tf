# Static Astro/Starlight site on Amplify Hosting, built from GitHub on push.
#
# This is a pure static build (Astro -> dist/), so platform = "WEB" — no SSR
# compute, no managed routing. Amplify just serves the prerendered files behind
# its CloudFront CDN.

resource "aws_amplify_app" "web" {
  name       = var.project
  repository = var.github_repository

  # Amplify requires a token at creation to connect a Git repo + add the push
  # webhook. We pass a GitHub token (gh OAuth token or PAT, repo scope) via
  # TF_VAR_github_access_token at first apply. After creation we ignore drift on
  # it, so the connection can later be migrated to the AWS Amplify GitHub App in
  # the console without `apply` trying to re-attach the token (which would break
  # the repo clone). See hashicorp/terraform-provider-aws#25122.
  # null (not "") when unset, so routine applies without a token pass schema
  # validation; ignore_changes keeps the existing connection untouched.
  access_token = var.github_access_token != "" ? var.github_access_token : null

  lifecycle {
    ignore_changes = [access_token]
  }

  platform = "WEB"

  environment_variables = {
    # Google Tag Manager container — shared across the SpecCraft properties.
    # (The GTM snippet is hard-wired in astro.config.mjs; this is here for
    # parity/visibility and any future build-time use.)
    GTM_ID = "GTM-N2BNSMZ6"
  }

  # Build spec lives here as code (authoritative). When an app has an inline
  # build_spec, Amplify ignores any amplify.yml committed at the repo root.
  build_spec = <<-YAML
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  YAML

  # Serve Astro's prerendered 404 page for unknown paths instead of Amplify's
  # generic one. 404-rewrite (not redirect) keeps the URL and returns 404.
  custom_rule {
    source = "/<*>"
    target = "/404.html"
    status = "404-200"
  }
}

resource "aws_amplify_branch" "main" {
  app_id            = aws_amplify_app.web.id
  branch_name       = var.amplify_branch
  enable_auto_build = true
  framework         = "Astro"
  stage             = "PRODUCTION"
}

# Custom domain: serve the site at the apex (speccraft.io) AND at www. Amplify
# provisions one managed ACM cert covering both names. wait_for_verification =
# false so apply doesn't block on ACM; the Route 53 records in dns.tf let
# Amplify verify asynchronously (status reaches "Available" within minutes of
# DNS propagating).
resource "aws_amplify_domain_association" "web" {
  app_id                = aws_amplify_app.web.id
  domain_name           = var.root_domain
  wait_for_verification = false

  # Apex: speccraft.io
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }

  # www.speccraft.io
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }
}
