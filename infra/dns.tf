# DNS in the existing speccraft.io Route 53 hosted zone.
#
# Amplify returns its required records as "<name> <TYPE> <value>" strings. We
# parse and publish them so Amplify can validate the ACM cert and route traffic
# to the apex and www.

data "aws_route53_zone" "main" {
  name         = "${var.root_domain}."
  private_zone = false
}

locals {
  # Universal CloudFront hosted-zone id — used for any A-record alias targeting
  # a CloudFront (Amplify) distribution. Same value globally; not region-specific.
  cloudfront_zone_id = "Z2FDTNDATAQYW2"

  amplify_cert_record = split(" ", aws_amplify_domain_association.web.certificate_verification_dns_record)

  # prefix => CloudFront target host (3rd field of the "<name> CNAME <target>"
  # dns_record Amplify returns for each sub_domain).
  amplify_targets = {
    for s in aws_amplify_domain_association.web.sub_domain : s.prefix => split(" ", s.dns_record)[2]
  }
}

# ACM cert validation record (Amplify rotates this if the association is
# recreated). Validating this lets Amplify issue the cert while the apex can
# still point at the old origin — so the traffic cutover below is a clean flip.
resource "aws_route53_record" "amplify_cert" {
  zone_id         = data.aws_route53_zone.main.zone_id
  name            = local.amplify_cert_record[0]
  type            = local.amplify_cert_record[1]
  ttl             = 300
  records         = [local.amplify_cert_record[2]]
  allow_overwrite = true
}

# Apex speccraft.io -> Amplify CloudFront. Must be an A-record ALIAS: you can't
# CNAME a zone apex.
resource "aws_route53_record" "apex" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.root_domain
  type    = "A"

  alias {
    name                   = local.amplify_targets[""]
    zone_id                = local.cloudfront_zone_id
    evaluate_target_health = false
  }

  allow_overwrite = true
}

# www.speccraft.io -> Amplify CloudFront. Published as an A-record ALIAS (not a
# CNAME) so it cleanly overwrites any pre-existing www record without a
# CNAME/A type conflict in Route 53.
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${var.root_domain}"
  type    = "A"

  alias {
    name                   = local.amplify_targets["www"]
    zone_id                = local.cloudfront_zone_id
    evaluate_target_health = false
  }

  allow_overwrite = true
}
