# Staging Deployment Guide - Render.com

This guide explains how to set up automated deployment to Render.com using Git integration.

## Architecture

```
Code pushed to develop
         ↓
Publish draft release (manual approval)
         ↓
Merge develop → main + create tag
         ↓
Render.com auto-deploys from main
         ↓
Health checks verify deployment
```

## Prerequisites

- Render.com account (free tier works for staging)
- GitHub repository with Render integration
- 3 services created on Render.com (frontend, auth, discord-notifier)

## 1. Setup Render.com Services

### 1.1 Create Frontend Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. **Connect Repository**: Select your GitHub repo
4. **Settings**:
   - **Name**: `devsecops-staging-frontend`
   - **Environment**: `Docker`
   - **Branch**: `staging`
   - **Build Command**: `docker build -t frontend .`
   - **Start Command**: Leave blank (uses Dockerfile CMD)

5. **Environment Variables**:
   ```
   NODE_ENV=staging
   VITE_API_URL=https://devsecops-staging-auth.onrender.com
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-key>
   ```

6. **Plan**: Free (or Starter if needed)
7. Click **Create Web Service**

### 1.2 Create Auth Service on Render

1. **New +** → **Web Service**
2. **Settings**:
   - **Name**: `devsecops-staging-auth`
   - **Environment**: `Docker`
   - **Branch**: `staging`
   - **Root Directory**: `services/auth`

3. **Environment Variables**:
   ```
   NODE_ENV=staging
   JWT_SECRET=<generate-random-secret>
   DATABASE_URL=<postgres-url-if-needed>
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-key>
   ```

4. Click **Create Web Service**

### 1.3 Create Discord Notifier Service on Render

1. **New +** → **Web Service**
2. **Settings**:
   - **Name**: `devsecops-staging-discord-notifier`
   - **Environment**: `Docker`
   - **Branch**: `staging`
   - **Root Directory**: `services/discord-notifier`

3. **Environment Variables**:
   ```
   NODE_ENV=staging
   DISCORD_WEBHOOK_URL=<your-discord-webhook>
   ```

4. Click **Create Web Service**

## 2. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Value |
|---|---|
| `RENDER_STAGING_URL` | `https://devsecops-staging-frontend.onrender.com` |

That's it! No SSH keys needed with Render git integration.

## 3. How It Works

### Automatic Deployment Flow

**Step 1**: Code pushed to develop/feature branch
```bash
git push origin feature/unit-testing
```

**Step 2**: Workflow 1 (CI) runs tests & creates draft release
- Tests pass
- Coverage report generated
- Draft release created with tag like `v0.0.0-rc.TIMESTAMP.SHA`

**Step 3**: Manual approval gate (you publish the release)
- Go to GitHub Releases
- Find Draft release
- Click **Publish release** ← This is the manual gate

**Step 4**: Workflow 2 (Merge) triggers automatically
- Merges your branch → `main`
- Creates dynamic tag `v1.0.COMMIT_COUNT-TIMESTAMP`
- Pushes both to GitHub

**Step 5**: Workflow 3 (Deploy) triggers automatically
- Pushes main branch → `staging` branch
- Render detects push to `staging`
- Render auto-deploys all services
- Health checks verify deployment

### Timeline
```
Publish Release → Merge (30s) → Deploy (2-5 min) → Health Checks (1 min)
Total: ~3-6 minutes from approval to live staging
```

## 4. How Render Auto-Deploys

Render is configured to watch your `main` branch and automatically deploy whenever it changes:

1. **Workflow 2** merges develop → main
2. **Workflow 2** pushes new tag to GitHub
3. Render detects the push to `main` branch
4. Render auto-starts deployment of all 3 services
5. Services restart with latest code from `main`

**No manual deployment needed** - it's completely automatic!

## 5. Monitoring Deployment

### Check Deployment Status on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on each service (frontend, auth, discord-notifier)
3. View **Logs** to see deployment progress
4. Check **Environment** to verify variables

### View GitHub Actions Progress

1. Go to your GitHub repo
2. Click **Actions**
3. Find workflow **"3️⃣ Deploy Tagged Release to Staging"**
4. Open the latest run to see:
   - Push to staging branch ✅
   - Health check results ✅
   - Deployment report ✅

### Test Staging Environment

```bash
# Frontend
curl https://devsecops-staging-frontend.onrender.com/health

# Auth API
curl https://devsecops-staging-auth.onrender.com/health

# Check API docs
https://devsecops-staging-auth.onrender.com/api-docs
```

## 6. Troubleshooting

### Deployment Stuck/Not Starting

```
Problem: Render shows "Build in progress" for too long
Solution:
1. Check Render dashboard Logs
2. If build failed, see error message
3. Common causes:
   - Missing environment variable
   - Dockerfile error
   - Node version mismatch
```

### Health Checks Fail

```
Problem: "Auth service is healthy" check fails
Solution:
1. Check if service is actually running on Render
2. Verify /health endpoint exists in your API
3. Check environment variables are set correctly
4. If service just deployed, wait 1-2 more minutes
```

### Services Can't Communicate

```
Problem: Frontend can't reach auth service
Solution:
1. Frontend env var should be:
   VITE_API_URL=https://devsecops-staging-auth.onrender.com
2. Make sure it's the full HTTPS URL (not localhost)
3. Restart services from Render dashboard
```

### Environment Variables Not Loading

```
Problem: Services crash due to missing env vars
Solution:
1. Go to Render service settings
2. Click "Environment"
3. Verify all required variables are set
4. Redeploy service (click "Redeploy")
```

## 7. Cost Considerations

**Free Tier Limitations (Render.com)**:
- 3 free instances (perfect for our 3 services)
- Auto-sleeps after 15 mins of inactivity
- 0.1 CPU per instance
- 512 MB memory per instance
- Wakes up when accessed

**Upgrade Options**:
- Starter Plan: $7/month per service
- Always on, better performance

## 8. Security Notes

1. **Secrets**: All API keys, webhook URLs stored in GitHub Secrets
2. **Branch Protection**: Only approved releases can push to `staging`
3. **Logs**: Available on Render dashboard (limit to team access)
4. **SSL/TLS**: Render provides free HTTPS for all services

## 9. Next Steps

### Production Deployment (after staging validated)

```
Similar setup but:
1. Create production services on Render
2. Track deploys with production tags (v1.0.0)
3. Add manual approval gate before production
4. Create separate workflow for production
```

## 10. Links

- [Render Documentation](https://render.com/docs)
- [Render GitHub Integration](https://render.com/docs/github)
- [Environment Variables on Render](https://render.com/docs/environment-variables)
- [Docker Deployment on Render](https://render.com/docs/docker)
