# Tienda - Backend, Frontend y Despliegue en AWS

Este proyecto agrupa un backend Node.js/Express, un frontend React servido por Nginx y la infraestructura como codigo con Terraform para ejecutar la solucion en AWS sobre ECS Fargate.

La arquitectura final replica el diagrama propuesto: usuarios ingresan por Route53 -> CloudFront (protegido por WAF) -> ALB -> ECS en subredes privadas; la persistencia se maneja con RDS Multi-AZ y AWS Backup.

---

## 1. Requisitos previos

- Docker y Docker Compose
- Node.js 18+ y npm (para desarrollo local)
- Terraform 1.3+ y AWS CLI configurado (```aws configure```)
- Cuenta de AWS con permisos para VPC, ECS, RDS, ALB, CloudFront, WAF, Route53, Secrets Manager, IAM y CloudWatch
- Dos certificados ACM en ```us-east-1```: uno para el ALB y otro (puede ser el mismo) para CloudFront

---

## 2. Estructura del repositorio

```bash
IaaC_Project_AWS/
├─ infra/              # Terraform
├─ tienda-backend/     # API Express
├─ tienda-frontend/    # SPA React + Nginx
├─ docker-compose.yml
└─ README.md
```

---

## 3. Variables de entorno locales

Plantillas incluidas:

- ```tienda-backend/.env.example```
- ```tienda-frontend/.env.example```

Copia cada archivo a ```.env``` y adapta los valores sensibles antes de ejecutar ```npm run dev``` o ```docker-compose```.

---

## 4. Desarrollo local

### Backend

```bash
cd tienda-backend
cp .env.example .env
npm install
npm run dev   # usa nodemon o tu herramienta preferida
```

El API queda en ```http://localhost:3000```.

### Frontend

```bash
cd tienda-frontend
cp .env.example .env
npm install
npm run dev
```

Vite expone la SPA en ```http://localhost:5173``` y reenvia ```/api``` al backend (puerto 3000) via proxy declarado en ```vite.config.js```.

---

## 5. Docker Compose

```bash
docker-compose up --build
```

Servicios incluidos: backend (3000), frontend (80) y MySQL 8 (3306, con volumen ```db_data```). Ajusta credenciales mediante variables definidas en ```docker-compose.yml``` o archivos ```.env```.

---

## 6. Construccion y publicacion de imagenes

```bash
# Backend
docker build -t tienda-backend ./tienda-backend

# Frontend (puedes sobrescribir la URL del API con --build-arg VITE_API_BASE_URL)
docker build -t tienda-frontend ./tienda-frontend
```

Publica en ECR antes del despliegue:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
docker tag tienda-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/tienda-backend:latest
docker tag tienda-frontend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/tienda-frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/tienda-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/tienda-frontend:latest
```

---

## 7. Despliegue con Terraform

1. Clonar el repositorio:

```bash
git clone https://github.com/AndreToral/IaaC_Project_AWS.git
cd IaaC_Project_AWS
```

2. Ejecuta Terraform:

   ```bash
   cd infra
   terraform init
   terraform plan
   terraform apply
   ```

3. Recursos principales creados:

   - **Red**: VPC con subredes publicas y privadas en dos AZ, NAT Gateway e Internet Gateway.
   - **Borde**: CloudFront distribuye el trafico global, protegido por AWS WAF (scope CLOUDFRONT) y apuntando al ALB.
   - **Balanceo**: ALB con listeners HTTP->HTTPS y prioridad ```/api/*``` hacia el backend.
   - **Compute**: ECS Fargate (2 replicas por servicio) con logs en CloudWatch y acceso controlado via IAM roles (execution + task role con permisos para Secrets Manager).
   - **Datos**: RDS MySQL Multi-AZ (standby sincronizada), backups gestionados por AWS Backup, y Secrets Manager para credenciales rotables.
   - **DNS**: Route53 Hosted Zone con alias del dominio raiz hacia CloudFront.
   - **Repos**: ECR para backend y frontend.

4. Revisa los outputs para obtener dominios del ALB, CloudFront, endpoints de RDS/Redis y nombres de servicios ECS.

```bash
terraform output
```

---

## 8. Operacion y buenas practicas

- Mantener secretos en Secrets Manager; las tareas ECS obtienen ```DB_PASSWORD``` directamente mediante permisos de IAM.
- Configura CloudWatch dashboards/alarms adicionales segun tus SLA (los logs se almacenan en ```/ecs/tienda-*```).
- Usa GitHub Actions con OIDC o CodeDeploy para CI/CD continuo, tal como ilustra el diagrama.
- Asegura la rotacion de certificados y credenciales antes de la caducidad.

---

## 9. Soporte

Reporta incidencias o nuevas funcionalidades mediante issues o pull requests en tu repositorio remoto.

