# Terraform + provider pins for the static-site (Amplify) stack.
#
# State: remote in S3. We reuse the existing shared speccraft state bucket
# (versioned, AES256-encrypted, Block Public Access on, native S3 locking via
# use_lockfile) under a distinct key, so this project gets isolated state
# without standing up a second bucket. Locking is native to the S3 backend
# (TF >= 1.10) — no DynamoDB table needed.

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  backend "s3" {
    bucket       = "speccraft-tfstate-116085141062"
    key          = "speccraft-io/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true # native S3 locking (TF >= 1.10); no DynamoDB
  }
}
