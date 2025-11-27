# Production Deployment Guide

This guide covers deploying Kliiq to production on various platforms.

---

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git repository pushed to GitHub
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)

---

## Environment Variables

**Critical**: Set these in production:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/kliiq

# Authentication
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://yourdomain.com

# Optional
API_URL=https://yourdomain.com
NODE_ENV=production
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Option 1: Docker Compose (Self-Hosted)

### Local Testing

```bash
# Create .env.prod file
cp .env.example .env.prod

# Edit with your values
nano .env.prod

# Start with production compose
docker-compose -f docker-compose.prod.yml up -d

# Verify health
curl http://localhost:3000/api/health
```

### Production Deployment (DigitalOcean, AWS EC2, etc.)

**1. SSH into your server**
```bash
ssh root@your.server.ip
```

**2. Install Docker & Docker Compose**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**3. Clone repository**
```bash
cd /opt
sudo git clone https://github.com/pill2x/Kliiq.git
cd Kliiq
```

**4. Create environment file**
```bash
sudo cp .env.example .env.prod
sudo nano .env.prod

# Set:
# DATABASE_URL=postgresql://kliiq_user:YOUR_SECURE_PASSWORD@db:5432/kliiq
# NEXTAUTH_SECRET=<your-openssl-generated-key>
# NEXTAUTH_URL=https://your-domain.com
```

**5. Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com
```

**6. Create Nginx reverse proxy**
```bash
sudo apt-get install nginx

# Create /etc/nginx/sites-available/kliiq
sudo tee /etc/nginx/sites-available/kliiq > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/kliiq /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

**7. Start application**
```bash
sudo docker-compose -f docker-compose.prod.yml up -d

# View logs
sudo docker-compose -f docker-compose.prod.yml logs -f
```

**8. Run database migrations**
```bash
sudo docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

---

## Option 2: Vercel Deployment

### 1. Sign up for Vercel
https://vercel.com/signup

### 2. Connect GitHub repository
```bash
# In Vercel dashboard:
# 1. New Project → Import Git Repository
# 2. Select your Kliiq repo
# 3. Choose Next.js framework
```

### 3. Configure environment variables
In Vercel Project Settings:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<your-key>
NEXTAUTH_URL=https://kliiq.vercel.app
```

### 4. Database setup
- Use **Vercel Postgres** or external PostgreSQL
- Vercel provides easy integration

### 5. Deploy
```bash
# Git push triggers automatic deployment
git push origin main
```

### 6. Custom domain
```
Settings → Domains → Add your-domain.com
```

**Vercel automatically handles SSL!**

---

## Option 3: AWS Deployment

### Option 3A: AWS ECS + RDS

**1. Create RDS PostgreSQL instance**
```bash
aws rds create-db-instance \
  --db-instance-identifier kliiq \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username kliiq_user \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --publicly-accessible
```

**2. Create ECR repository**
```bash
aws ecr create-repository --repository-name kliiq
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

**3. Build and push Docker image**
```bash
docker build -t kliiq .
docker tag kliiq:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/kliiq:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/kliiq:latest
```

**4. Create ECS task definition**
```json
{
  "family": "kliiq",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "kliiq",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/kliiq:latest",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://kliiq_user:password@rds-endpoint:5432/kliiq"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "value": "<your-secret>"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kliiq",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512"
}
```

**5. Create ECS service**
```bash
aws ecs create-service \
  --cluster kliiq \
  --service-name kliiq \
  --task-definition kliiq \
  --desired-count 2 \
  --launch-type FARGATE
```

### Option 3B: AWS Amplify

**1. Connect to Amplify**
```bash
npm install -g @aws-amplify/cli
amplify init
```

**2. Add hosting**
```bash
amplify add hosting
amplify publish
```

---

## Option 4: DigitalOcean App Platform

**1. Push code to GitHub**
```bash
git push origin main
```

**2. In DigitalOcean dashboard**
- Apps → Create App → Connect GitHub
- Select Kliiq repository
- Configure build/run commands:
  - Build: `npm run build`
  - Run: `npm start`

**3. Add PostgreSQL database**
- Add Component → Database → PostgreSQL

**4. Configure environment**
```
DATABASE_URL=${db.DATABASE_URL}
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=<your-app-url>
```

**5. Deploy**
- Click Deploy
- DigitalOcean handles SSL automatically

---

## Monitoring & Maintenance

### Health Check Endpoint
```bash
# Verify production is running
curl https://your-domain.com/api/health
```

### Database Backups

**PostgreSQL backup**
```bash
docker exec kliiq_db_prod pg_dump \
  -U kliiq_user kliiq > backup.sql
```

**Restore backup**
```bash
docker exec -i kliiq_db_prod psql \
  -U kliiq_user kliiq < backup.sql
```

### View Logs

**Docker**
```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

**Vercel**
```
Dashboard → Deployments → Select → Functions → Logs
```

**AWS**
```bash
aws logs tail /ecs/kliiq --follow
```

### Update Application

**Pull latest code**
```bash
git pull origin main
```

**Restart Docker**
```bash
docker-compose -f docker-compose.prod.yml restart
```

---

## Security Checklist

- [ ] Change default database passwords
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Use HTTPS only (redirect HTTP)
- [ ] Enable database backups
- [ ] Set up monitoring/alerts
- [ ] Use environment secrets, not hardcoded values
- [ ] Enable database encryption
- [ ] Set up firewall rules
- [ ] Enable CORS properly
- [ ] Regular security updates

---

## Performance Tuning

### Database Connection Pooling

```bash
# docker-compose.prod.yml
environment:
  DATABASE_URL: postgresql://user:pass@db/kliiq?statement_cache_size=0&pgbouncer=true
```

### CDN Setup

```bash
# Cloudflare integration for caching
# Set cache rules for /_next/static/*
```

### Auto-scaling

**DigitalOcean**
- App Platform → Settings → Auto Scaling

**AWS ECS**
- ECS Service → Auto Scaling

---

## Troubleshooting

### Database connection failed
```bash
# Check database logs
docker-compose logs db

# Verify connection string
echo $DATABASE_URL
```

### Application not starting
```bash
# Check app logs
docker-compose -f docker-compose.prod.yml logs app

# Rebuild image
docker-compose build --no-cache
```

### Migration errors
```bash
# Run migrations manually
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

---

## Support

- GitHub Issues: https://github.com/pill2x/Kliiq/issues
- Documentation: `README.md`
- Architecture: `TECH_STACK_SUMMARY.md`
