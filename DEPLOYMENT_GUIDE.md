# Deployment Guide - Docker Hub to Staging Server

Simple deployment following the beginner CI/CD pattern: **Push → Test → Approve → Deploy**

## Overview

```
1. Write code & push to develop
   ↓
2. ✅ Automatic Tests Run
   ↓
3. 📦 Draft Release Created
   ↓
4. 👥 Team Approves (Publish Release)
   ↓
5. ✅ Auto-Merge to main
   ↓
6. 🏷️ Auto-Tag with version
   ↓
7. 🏗️ Build & Push Docker Images to Docker Hub
   ↓
8. 🚀 Pull & Deploy to Staging Server
   ↓
9. ✅ Health Checks Pass
   ↓
🎉 LIVE IN STAGING!
```

## Prerequisites

### 1. Docker Hub Account
- Go to [Docker Hub](https://hub.docker.com)
- Create account
- Note your **username**

### 2. Generate Docker Hub Token
- Login to Docker Hub
- Click profile icon → Account Settings
- Click **Security** → **New Access Token**
- Create token (name: `github-actions`)
- Copy the token value

### 3. Staging Server (Linux)
- Any Linux server (cloud, on-prem, or local VM)
- SSH access enabled
- Docker & Docker Compose installed

### 4. Generate SSH Key for GitHub Actions
```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy -N ""

# Copy public key to staging server
ssh-copy-id -i ~/.ssh/github_deploy deploy@your-staging-server.com

# Get private key (for GitHub secret)
cat ~/.ssh/github_deploy
```

## Setup (One Time)

### Step 1: Add GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions**

Create these secrets:

| Secret Name | Value |
|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub token (from above) |
| `STAGING_SERVER_HOST` | Your staging server IP or hostname |
| `STAGING_SSH_USER` | SSH user (usually `deploy` or `ubuntu`) |
| `STAGING_SSH_PRIVATE_KEY` | Content of `~/.ssh/github_deploy` file |

### Step 2: Setup Staging Server

```bash
# SSH into your staging server
ssh deploy@your-staging-server.com

# Create project directory
mkdir -p ~/devsecops-staging
cd ~/devsecops-staging

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: "3.9"

services:
  discord-notifier:
    image: yourusername/devops-discord-notifier:latest
    container_name: devsecops-discord-notifier
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL}
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  auth:
    image: yourusername/devops-auth:latest
    container_name: devsecops-auth
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      discord-notifier:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  frontend:
    image: yourusername/devops-frontend:latest
    container_name: devsecops-frontend
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://localhost:3000
    depends_on:
      auth:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  default:
    name: devsecops-network
EOF
```

### Step 3: Create .env file on Staging Server

```bash
cat > .env << 'EOF'
# Docker Hub credentials
DOCKER_USERNAME=yourusername
DOCKER_PASSWORD=your-token-here

# Application secrets
JWT_SECRET=your-jwt-secret-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
EOF

chmod 600 .env
```

## Day-to-Day Usage

### For Developers

```bash
# 1. Make changes and push to develop
git push origin develop

# → Workflow 1 runs automatically
# → Tests execute
# → Draft release created (takes ~3 minutes)
```

### For Team Lead (Approval)

```
1. Go to GitHub Releases
2. Find draft release
3. Review test results and code changes
4. Click "Publish release"

→ Workflow 2 runs automatically
→ Merges develop into main
→ Creates version tag (takes ~1 minute)

→ Workflow 3 runs automatically
→ Builds Docker images
→ Pushes to Docker Hub
→ SSH deploys to staging
→ Health checks verify (takes ~5 minutes)

Total: ~9 minutes from approval to live!
```

## Monitoring Deployment

### Watch GitHub Actions

1. Go to repo → **Actions**
2. See progress of all three workflows:
   - **1️⃣ Build & Test** (Workflow 1)
   - **2️⃣ Approval & Merge** (Workflow 2)
   - **3️⃣ Deploy to Staging** (Workflow 3)

### Check Staging Server

```bash
# SSH to staging server
ssh deploy@your-staging-server.com

# Check container status
cd ~/devsecops-staging
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs frontend
docker-compose logs auth
docker-compose logs discord-notifier
```

### Test Staging Services

```bash
# Frontend
curl http://your-staging-server.com/health

# Auth API
curl http://your-staging-server.com:3000/health

# Discord Notifier
curl http://your-staging-server.com:3001/health
```

## Troubleshooting

### SSH Connection Fails

```bash
# Check SSH key is readable
ls -la ~/.ssh/github_deploy

# Test SSH manually from your machine
ssh -i ~/.ssh/github_deploy deploy@your-staging-server.com

# Check server firewall
sudo ufw status
sudo ufw allow 22
```

### Docker Pull Fails

```bash
# Check Docker Hub credentials
docker login -u yourusername

# Verify image exists
docker search yourusername/devops-frontend

# Check Docker Hub rate limits
curl -H "Authorization: Bearer TOKEN" https://api.docker.com/v2/rate_limit
```

### Health Checks Fail

```bash
# SSH to server and check logs
ssh deploy@your-staging-server.com
cd ~/devsecops-staging

# Check which containers failed
docker-compose ps

# View error logs
docker-compose logs frontend
docker-compose logs auth

# Try manual health checks
curl http://localhost/health
curl http://localhost:3000/health
```

### Services Won't Start

```bash
# SSH to server
ssh deploy@your-staging-server.com
cd ~/devsecops-staging

# Check for port conflicts
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000

# Manually test docker-compose
docker-compose down
docker-compose up

# Check environment variables
cat .env
```

## Rollback to Previous Version

If deployment has issues:

```bash
# SSH to staging server
ssh deploy@your-staging-server.com
cd ~/devsecops-staging

# Stop current deployment
docker-compose down

# Pull previous version
docker pull yourusername/devops-frontend:v1.0.0-previous
docker pull yourusername/devops-auth:v1.0.0-previous

# Update docker-compose.yml manually or via sed
sed -i 's/:latest/:v1.0.0-previous/g' docker-compose.yml

# Restart
docker-compose up -d
```

## Complete Workflow Summary

| Step | Trigger | Duration | Auto/Manual |
|------|---------|----------|-------------|
| Push to develop | Developer | 0 min | Manual |
| Run tests | Push detected | 3 min | Auto |
| Create draft | Tests pass | 3 min | Auto |
| Publish release | Team reviews | 3 min | Manual |
| Merge to main | Release published | 1 min | Auto |
| Create tag | Merge completes | 1 min | Auto |
| Build images | Tag created | 2 min | Auto |
| Push to Docker Hub | Build completes | 1 min | Auto |
| SSH deploy | Push completes | 2 min | Auto |
| Health checks | Deploy starts | 1 min | Auto |
| **TOTAL** | | **~9 min** | |

## Production Deployment

Once staging is validated:

1. Create a **4️⃣ Deploy to Production** workflow
2. Add manual approval gate before production
3. Use different server credentials
4. Same deployment pattern

## Next Steps

1. ✅ Configure GitHub Secrets
2. ✅ Setup staging server
3. ✅ Create .env file
4. ✅ Push code to develop
5. ✅ Publish draft release
6. ✅ Watch deployment complete
7. 🎉 Access staging environment
