# Tienda - Guia Completa de Despliegue

Este repositorio contiene tres piezas principales:

- **Backend**: API REST en Node.js/Express (`tienda-backend`).
- **Frontend**: SPA en React servida por Nginx (`tienda-frontend`).
- **Infraestructura**: Terraform para aprovisionar la solucion en AWS (`infra`).

La arquitectura objetivo es: usuarios -> Route53 -> CloudFront (con WAF) -> ALB -> tareas ECS Fargate en subredes privadas. Los datos residen en RDS MySQL y se respaldan con AWS Backup.

---

## 1. Herramientas necesarias

Instala y verifica estas utilidades en tu maquina local:

| Herramienta | Version sugerida | Comando de verificacion |
|-------------|------------------|-------------------------|
| Git         | 2.30+            | `git --version` |
| Node.js     | 18+              | `node --version` |
| npm         | 8+               | `npm --version` |
| Docker      | 20+              | `docker --version` |
| Terraform   | 1.3+             | `terraform version` |
| AWS CLI v2  | 2.7+             | `aws --version` |
| Ansible     | 2.14+            | `ansible --version` |

1. Configura el AWS CLI con credenciales validas: `aws configure`.
2. Si estas en Windows, usa WSL2 para facilitar Docker/Ansible o ejecuta todo desde una instancia Linux.
3. En Docker Desktop, activa la integracion con WSL2 si corresponde.

---

## 2. Clonar el repositorio y revisar la estructura

```bash
git clone https://github.com/AndreTurariOrg/IaaC_Project_AWS.git
cd IaaC_Project_AWS/infra
```

Estructura relevante:

```
.
├─ infra/              # Terraform (VPC, ALB, ECS, RDS, etc.)
├─ tienda-backend/     # API Express
├─ tienda-frontend/    # SPA React + Nginx
├─ ansible/            # Playbooks para ECR
├─ docker-compose.yml  # Entorno local con Docker Compose
└─ README.md           # Esta guia
```

---

## 3. Configurar variables de entorno locales

Cada aplicacion incluye un `.env.example`.

```bash
cp tienda-backend/.env.example tienda-backend/.env
cp tienda-frontend/.env.example tienda-frontend/.env
```

Edita los archivos `.env` segun necesites (credenciales, URLs, etc.).

---

## 4. Probar el backend y frontend en modo desarrollo

### Backend

```bash
cd tienda-backend
npm install
npm run dev
```

El API queda en `http://localhost:3000`.

### Frontend

```bash
cd tienda-frontend
npm install
npm run dev
```

La SPA se expone en `http://localhost:5173` y reenvia `/api` al backend.

---

## 5. Ejecutar todo con Docker Compose (opcional)

```bash
docker-compose up --build
```

Servicios levantados:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost`
- MySQL 8: puerto `3306`, credenciales definidas en `docker-compose.yml`

Para detener: `docker-compose down` (agrega `-v` si quieres borrar volumenes).

---

## 6. Preparar imagenes Docker para produccion

### 6.1 Construir imagenes manualmente (referencia rapida)

```bash
docker build -t tienda-backend:latest ./tienda-backend
docker build -t tienda-frontend:latest ./tienda-frontend
```

### 6.2 Publicar en ECR automaticamente con Ansible

1. Instala las colecciones necesarias:
   ```bash
   ansible-galaxy collection install community.docker community.general
   ```
2. Edita `ansible/group_vars/all.yml` y actualiza:
   - `aws_region`: region del registro ECR.
   - `aws_account_id`: ID de 12 digitos de tu cuenta.
   - `backend_ecr_repo` / `frontend_ecr_repo`: repositorios existentes en ECR.
   - `image_tag`: etiqueta que se publicara (ej. `latest` o un SHA).
   - `backend_build_context` / `frontend_build_context`: rutas al contexto de build.
   - `frontend_build_args`: argumentos opcionales (puedes vaciar el diccionario si no aplican).
3. Asegurate de que Docker este corriendo en tu maquina (o en el host definido en `ansible/inventory.ini`). Por defecto el inventario usa `localhost`.
4. Exporta tus credenciales si no usas un perfil:
   ```bash
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   export AWS_SESSION_TOKEN=... # opcional
   ```
   O bien, define `AWS_PROFILE=mi-perfil` antes de ejecutar el playbook.
5. Ejecuta el playbook:
   ```bash
   ansible-playbook -i ansible/inventory.ini ansible/push_ecr.yml
   ```

El playbook ejecuta `docker info`, obtiene el token de login con `aws ecr get-login-password`, construye las imagenes de backend y frontend, y las etiqueta/push a `ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/<repo>:<tag>`.

Para usar otro tag dinamico:
```bash
ansible-playbook -i ansible/inventory.ini ansible/push_ecr.yml -e image_tag=$(git rev-parse --short HEAD)
```

---

## 7. Aprovisionar infraestructura en AWS con Terraform

1. Ubicate en la carpeta `infra/`:
   ```bash
   cd infra
   ```
2. Inicializa y revisa el plan:
   ```bash
   terraform init
   terraform plan
   ```
   Pasa variables si las necesitas (por ejemplo, IDs de certificados ACM).
3. Aplica los cambios:
   ```bash
   terraform apply
   ```
   Confirma con `yes` cuando se muestre el plan.
4. Al terminar, revisa los outputs para obtener endpoints utiles (ALB, CloudFront, RDS, etc.):
   ```bash
   terraform output
   ```

> **Nota**: Terraform crea VPC, subredes publicas/privadas, NAT, ALB, ECS Fargate, RDS MySQL, Secrets Manager, CloudFront, WAF y Route53. Verifica que los repositorios ECR tengan las imagenes con el tag esperado antes de levantar las tareas ECS.

Para destruir la infraestructura (con cuidado): `terraform destroy`.

---

## 8. Cargar datos en RDS (opcional)

El RDS se crea en subredes privadas. Para administrar la base:

1. Usa un bastion o instancia en la VPC, o crea un tunel SSH/SSM que tenga acceso al security group del RDS.
2. Desde ese host ejecuta el cliente MySQL:
   ```bash
   mysql -h <endpoint-rds> -P 3306 -u tiendauser -p
   ```
   La contrasena inicial se define en `infra/database.tf` (`tiendapass`, cambiala si ya la rotaste).
3. Crea la base y ejecuta tus scripts (`SOURCE /ruta/script.sql;`).

Puedes automatizar la importacion con Ansible creando tareas que usen `community.mysql` desde un host dentro de la VPC.

---

## 9. Verificacion posterior al despliegue

1. **ECS**: revisa que las tareas de frontend y backend esten `RUNNING` y usando la imagen/tag correctos.
2. **ALB/CloudFront**: accede al dominio mostrado en los outputs de Terraform. Deberias ver la SPA funcionando.
3. **Logs**: revisa CloudWatch Logs (`/ecs/tienda-backend`, `/ecs/tienda-frontend`).
4. **Base de datos**: verifica conexiones en CloudWatch Metrics y ejecuta consultas de prueba.

---

## 10. Buenas practicas y siguientes pasos

- Guarda secretos en AWS Secrets Manager y rota credenciales periodicamente.
- Configura alarmas en CloudWatch (CPU/memoria de ECS, conexiones de RDS, estado del ALB).
- Automatiza pruebas y despliegues con un pipeline (GitHub Actions, CodePipeline, etc.) que invoque este playbook y Terraform.
- Antes de destruir recursos productivos, confirma snapshots/backups y dependencias DNS/certificados.

Con esta guia puedes pasar de un clon del repositorio a un despliegue funcional en AWS siguiendo los pasos en orden y validando cada etapa.