# infra/ — Terraform for the Amplify deploy

Provisions the **static-site** hosting for speccraft.io:

- **Amplify app** (`platform = "WEB"`) — builds the Astro/Starlight site from
  GitHub (`speccraft-io/speccraft-io`) on every push to `main` and serves
  `dist/` behind CloudFront.
- **Custom domain** — serves at the apex `speccraft.io` **and** `www.speccraft.io`,
  with the ACM-validation + apex/www alias records published into the existing
  `speccraft.io` Route 53 zone.

That's the whole stack — no VPC, DB, or compute. State is remote in the shared
`speccraft-tfstate-116085141062` S3 bucket under the key
`speccraft-io/terraform.tfstate`.

## Prerequisites

- AWS credentials with admin-ish rights in account `116085141062`.
- The `speccraft.io` hosted zone already exists in Route 53 (this code looks it
  up; it doesn't create it). The apex `speccraft.io` and `www` must be free to
  point at this app (the canvas app, if deployed, lives at `app.speccraft.io`).
- Terraform >= 1.10.

## Usage

```bash
cd infra
terraform init
# First apply connects the GitHub repo + registers the push webhook, which
# needs a token (gh OAuth token with repo scope works):
TF_VAR_github_access_token=$(gh auth token) terraform apply
```

Outputs:

- `amplify_default_domain` — works immediately (`https://main.xxxx.amplifyapp.com`).
- `web_url` — `https://speccraft.io`, live a few minutes after the cert verifies.
- `amplify_console_url` — deep link to watch builds.

## Zero-downtime cutover (apex already serving elsewhere)

If the apex is already live, apply in stages so traffic only flips once the new
site is verified and the cert is issued:

```bash
# 1. App + branch only; let the build run, then verify the default URL.
TF_VAR_github_access_token=$(gh auth token) \
  terraform apply -target=aws_amplify_app.web -target=aws_amplify_branch.main

# 2. Domain association + cert-validation record; Amplify issues the cert while
#    the apex still points at the old origin.
terraform apply -target=aws_amplify_domain_association.web -target=aws_route53_record.amplify_cert
# wait until: aws amplify get-domain-association ... domainStatus == AVAILABLE

# 3. Flip apex + www to Amplify (creates the alias A-records).
terraform apply
```

## Notes

- **Custom domain is async.** `wait_for_verification = false`, so apply returns
  fast; the domain shows "Available" once the Route 53 records propagate.
- **Build spec lives in `amplify.tf`** (inline `build_spec`), which is
  authoritative — any `amplify.yml` at the repo root is ignored.
- **GitHub App migration (optional).** The connection is created with a token,
  but `ignore_changes = [access_token]` lets you later switch it to the AWS
  Amplify GitHub App in the console without Terraform fighting it.
- **Token re-needed only on app recreate.** Routine `terraform apply` runs need
  no token; only creating the app does.
