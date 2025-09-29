resource "aws_iam_role" "backup" {
  name = "tienda-backup-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "backup.amazonaws.com" }
      Action   = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# RDS MySQL instance
resource "aws_db_subnet_group" "tienda" {
  name       = "tienda-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "tienda" {
  allocated_storage      = 20
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  username               = "tiendauser"
  password               = "tiendapass"
  parameter_group_name   = "default.mysql8.0"
  skip_final_snapshot    = true
  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.tienda.name
  multi_az               = true
  storage_encrypted      = true
  backup_retention_period = 7
}

resource "aws_backup_vault" "main" {
  name = "tienda-backup-vault"
}

resource "aws_backup_plan" "main" {
  name = "tienda-backup-plan"
  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 * * ? *)" # Diario a las 5am UTC
    lifecycle {
      delete_after = 30 # Retencion 30 dias
    }
  }
}

resource "aws_backup_selection" "main" {
  name         = "tienda-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn
  resources    = [aws_db_instance.tienda.arn]
}
