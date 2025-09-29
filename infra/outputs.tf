# Outputs for reference
output "ecr_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "rds_endpoint" {
  value = aws_db_instance.tienda.address
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_https_listener_arn" {
  value = aws_lb_listener.https.arn
}



output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "secretsmanager_db_arn" {
  value = aws_secretsmanager_secret.db.arn
}

output "waf_web_acl_arn" {
  value = aws_wafv2_web_acl.main.arn
}

output "route53_zone_id" {
  value = aws_route53_zone.main.zone_id
}

output "backend_service_name" {
  value = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  value = aws_ecs_service.frontend.name
}

