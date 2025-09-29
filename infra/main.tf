# Terraform main configuration for AWS infrastructure
terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "acm_certificate_arn" {
  description = "ARN del certificado SSL en ACM para el ALB"
  type        = string
}

variable "cloudfront_certificate_arn" {
  description = "ARN del certificado SSL en ACM (us-east-1) para CloudFront"
  type        = string
}

variable "domain_name" {
  description = "Dominio principal a publicar"
  type        = string
}

# Cache policy data sources for CloudFront
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}

# Secrets Manager para credenciales RDS
resource "aws_secretsmanager_secret" "db" {
  name = "tienda-db-credentials"
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = "tiendauser"
    password = "tiendapass"
    host     = aws_db_instance.tienda.address
    port     = 3306
    database = "tienda"
  })
}

# WAF Web ACL para CloudFront
resource "aws_wafv2_web_acl" "main" {
  name  = "tienda-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "wafCommonRules"
    }
  }

  visibility_config {
    sampled_requests_enabled   = true
    cloudwatch_metrics_enabled = true
    metric_name                = "wafMain"
  }
}

# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name
}

# CloudFront Distribution frente al ALB
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Distribucion CDN para tienda"
  aliases             = [var.domain_name]
  web_acl_id          = aws_wafv2_web_acl.main.arn
  default_root_object = "index.html"

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "tienda-alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "tienda-alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.cloudfront_certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  price_class = "PriceClass_100"

  logging_config {
    include_cookies = false
    bucket          = null
  }
}

# Alias principal hacia CloudFront
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# ECR repositories for backend and frontend
resource "aws_ecr_repository" "backend" {
  name = "tienda-backend"
}

resource "aws_ecr_repository" "frontend" {
  name = "tienda-frontend"
}

# VPC, subnets, security groups, RDS, ECS, ALB, etc. se definen en archivos separados.



