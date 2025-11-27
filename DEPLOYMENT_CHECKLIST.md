# Production Deployment Checklist

Use this checklist before deploying Kliiq to production.

## Pre-Deployment

- [ ] All tests passing (`npm run lint && npm run build`)
- [ ] Latest code committed and pushed to main branch
- [ ] Database migrations reviewed and tested
- [ ] Environment variables configured
- [ ] SSL certificate obtained (if self-hosted)
- [ ] Domain name registered and DNS configured
- [ ] Backups created
- [ ] Team notified of deployment

## Security

- [ ] NEXTAUTH_SECRET generated with `openssl rand -base64 32`
- [ ] Database password changed from default
- [ ] API keys stored in secrets, not code
- [ ] CORS properly configured
- [ ] Rate limiting configured on API routes
- [ ] SQL injection protections in place (Prisma handles this)
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Security headers configured
- [ ] No sensitive data in logs

## Infrastructure

- [ ] Database server provisioned
- [ ] Database created and migrations applied
- [ ] Docker images built and tested
- [ ] Container registry configured (if using Docker)
- [ ] Load balancer configured (if needed)
- [ ] Reverse proxy configured (Nginx/CloudFlare)
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] VPC/networking properly isolated

## Monitoring & Logging

- [ ] Error tracking configured (Sentry/LogRocket)
- [ ] Application logs centralized
- [ ] Database logs enabled
- [ ] Uptime monitoring configured
- [ ] Alert thresholds set (CPU, memory, disk)
- [ ] Health check endpoint tested

## GitHub Actions

- [ ] Secrets configured in GitHub repo:
  - [ ] DATABASE_URL (if auto-deploying)
  - [ ] VERCEL_TOKEN (if using Vercel)
  - [ ] AWS_ACCESS_KEY_ID (if using AWS)
  - [ ] DO_ACCESS_TOKEN (if using DigitalOcean)
- [ ] CI/CD workflow syntax validated
- [ ] Test job runs successfully
- [ ] Build job runs successfully
- [ ] Deployment job configured for your platform
- [ ] Protected main branch (require PR reviews)

## Platform-Specific

### Docker Compose (Self-Hosted)
- [ ] Docker installed and running
- [ ] docker-compose.prod.yml tested locally
- [ ] Volume mounts configured
- [ ] Network bridge configured
- [ ] Restart policies set
- [ ] Health checks pass

### Vercel
- [ ] Repository connected to Vercel
- [ ] Environment variables set in Vercel dashboard
- [ ] Preview deployments working
- [ ] Production domain configured
- [ ] Auto-deployments on push enabled

### AWS ECS
- [ ] RDS database created and accessible
- [ ] ECR repository created
- [ ] IAM roles and policies configured
- [ ] ECS cluster created
- [ ] Task definition registered
- [ ] ECS service created with auto-scaling
- [ ] Load balancer configured
- [ ] Route53 DNS records set

### DigitalOcean
- [ ] Account funded and billing configured
- [ ] PostgreSQL database created
- [ ] App spec configured
- [ ] Environment variables set
- [ ] Custom domain connected
- [ ] Auto-scaling configured (if needed)

## Post-Deployment

### Immediate (First Hour)
- [ ] Application accessible at domain
- [ ] Login page loads
- [ ] Authentication works (test login)
- [ ] Dashboard displays data
- [ ] Database connection verified via health check
- [ ] SSL certificate valid (no warnings)
- [ ] No errors in application logs

### Ongoing (First Day)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all API endpoints respond
- [ ] Test database backups
- [ ] Monitor disk space usage
- [ ] Check email notifications working (if applicable)

### Ongoing (First Week)
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] Response times acceptable
- [ ] No spike in errors
- [ ] Users able to complete workflows
- [ ] Backups running automatically

## Rollback Plan

If issues occur:

1. **Immediate rollback** (within 5 minutes)
   ```bash
   # Revert to previous version
   git revert HEAD
   git push origin main
   # GitHub Actions will auto-deploy previous version
   ```

2. **Database rollback** (if migrations failed)
   ```bash
   # Restore from backup
   docker exec -i kliiq_db_prod psql -U kliiq_user kliiq < backup.sql
   ```

3. **Notify team**
   - Send incident notification
   - Document what went wrong
   - Plan prevention for next time

## Communication

- [ ] Team notified of deployment
- [ ] Deployment status shared (Slack/Email)
- [ ] Users notified of maintenance (if applicable)
- [ ] Post-deployment verification complete
- [ ] Incident report filed (if issues occurred)

## Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Database schema documented
- [ ] API endpoints tested and documented
- [ ] Known limitations documented
- [ ] Emergency procedures documented

---

## Quick Deployment Commands

### Docker Compose
```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

### Vercel
```bash
# Deploy
vercel --prod --token $VERCEL_TOKEN

# Check status
vercel status
```

### AWS
```bash
# Update ECS service
aws ecs update-service --cluster kliiq --service kliiq --force-new-deployment
```

---

## Contact & Support

- **Documentation**: See `DEPLOYMENT.md`
- **Issues**: GitHub Issues
- **Questions**: Open a discussion in GitHub
