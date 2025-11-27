# GitHub Actions Secrets Setup

To enable CI/CD deployment, configure these secrets in your GitHub repository.

## How to Add Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret below

---

## Required Secrets

### Vercel Deployment
```
VERCEL_TOKEN
```
Get from: https://vercel.com/account/tokens

### AWS Deployment
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION (optional, defaults to us-east-1)
```
Create IAM user with:
- ECS full access
- ECR full access
- RDS full access
- CloudWatch logs access

### DigitalOcean Deployment
```
DO_ACCESS_TOKEN
DO_APP_ID
```
Get from: https://cloud.digitalocean.com/account/api/tokens

---

## Optional Secrets

### GitHub Container Registry
```
GHCR_USERNAME (your GitHub username)
GHCR_TOKEN (PAT with packages:write scope)
```

### Slack Notifications
```
SLACK_WEBHOOK
```
To notify on deployment success/failure

### Email Notifications
```
SENDGRID_API_KEY
DEPLOYMENT_EMAIL
```

---

## GitHub Actions Environment Setup

Add these to your repository for production deployments:

1. Go to Settings → Environments
2. Create "production" environment
3. Add deployment branches: `main`
4. Add required reviewers (optional)

---

## CI/CD Workflow

The pipeline automatically:
1. **Lints code** on every pull request
2. **Tests build** on every push
3. **Builds Docker image** on push to main/develop
4. **Deploys to development** when pushing to develop
5. **Deploys to production** when pushing to main

---

## Monitor CI/CD Status

- Go to Actions tab in GitHub
- View workflow runs and logs
- Check deployment status

---

## Troubleshooting

### Workflow not triggering
- Verify push is to main or develop branch
- Check Actions are enabled in Settings
- Review workflow file syntax: `.github/workflows/ci-cd.yml`

### Secrets not being used
- Verify secret names match exactly
- Secrets are case-sensitive
- Wait 30 seconds after adding secret before triggering workflow

### Deployment fails
- Check logs in Actions tab
- Verify all required secrets are set
- Ensure deploy scripts are executable
