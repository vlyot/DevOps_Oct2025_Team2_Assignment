# Render.com Staging Setup Checklist

Quick setup guide to get staging deployment working with Render.com.

## ✅ Step 1: Create Render Account

- [ ] Go to [render.com](https://render.com)
- [ ] Sign up with GitHub (recommended - auto-links account)
- [ ] Verify email

## ✅ Step 2: Create 3 Render Services

### Frontend Service
- [ ] Click **New +** → **Web Service**
- [ ] **Connect Repository**: Select your DevOps repo
- [ ] **Name**: `devsecops-staging-frontend`
- [ ] **Environment**: Docker
- [ ] **Branch**: `main`
- [ ] **Root Directory**: Leave empty
- [ ] Add **Environment Variables**:
  ```
  NODE_ENV=staging
  VITE_API_URL=https://devsecops-staging-auth.onrender.com
  VITE_SUPABASE_URL=YOUR_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
  ```
- [ ] **Plan**: Free
- [ ] Click **Create Web Service**
- [ ] Note the URL: `https://devsecops-staging-frontend.onrender.com`

### Auth Service
- [ ] Click **New +** → **Web Service**
- [ ] **Connect Repository**: Same repo
- [ ] **Name**: `devsecops-staging-auth`
- [ ] **Environment**: Docker
- [ ] **Branch**: `main`
- [ ] **Root Directory**: `services/auth`
- [ ] Add **Environment Variables**:
  ```
  NODE_ENV=staging
  JWT_SECRET=GENERATE_A_RANDOM_SECRET
  SUPABASE_URL=YOUR_SUPABASE_URL
  SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
  DATABASE_URL=YOUR_DATABASE_URL (if using)
  ```
- [ ] Click **Create Web Service**
- [ ] Note the URL: `https://devsecops-staging-auth.onrender.com`

### Discord Notifier Service
- [ ] Click **New +** → **Web Service**
- [ ] **Connect Repository**: Same repo
- [ ] **Name**: `devsecops-staging-discord-notifier`
- [ ] **Environment**: Docker
- [ ] **Branch**: `main`
- [ ] **Root Directory**: `services/discord-notifier`
- [ ] Add **Environment Variables**:
  ```
  NODE_ENV=staging
  DISCORD_WEBHOOK_URL=YOUR_DISCORD_WEBHOOK
  ```
- [ ] Click **Create Web Service**
- [ ] Note the URL: `https://devsecops-staging-discord-notifier.onrender.com`

## ✅ Step 3: Configure GitHub Secrets

- [ ] Go to your GitHub repo
- [ ] Settings → **Secrets and variables** → **Actions**
- [ ] Click **New repository secret**
- [ ] Create secret:
  - **Name**: `RENDER_STAGING_URL`
  - **Value**: `https://devsecops-staging-frontend.onrender.com`
- [ ] Click **Add secret**

That's it! No SSH keys needed.

## ✅ Step 4: Verify Workflow Setup

- [ ] File `.github/workflows/3-deploy-staging.yml` exists
- [ ] File `STAGING_DEPLOYMENT.md` exists
- [ ] All 3 services created on Render.com
- [ ] GitHub secret `RENDER_STAGING_URL` configured

## ✅ Step 5: Test the Pipeline

### Test Build & Test (Workflow 1)
```bash
# Make a small change to trigger CI
echo "# Test" >> README.md
git add README.md
git commit -m "test: trigger CI pipeline"
git push origin develop
```

- [ ] Wait 2-3 minutes for **Actions** → **1️⃣ RC Draft Release** to complete
- [ ] Go to **Releases** tab
- [ ] Find **Draft release** (tag like `v0.0.0-rc.YYYYMMDD_...`)

### Test Approval Gate (Manual)
- [ ] Open the draft release
- [ ] Review the changes
- [ ] Click **Publish release** ← This is the approval gate!

### Test Merge to Main (Workflow 2)
- [ ] Go back to **Actions**
- [ ] Find **2️⃣ Approval & Merge to Main**
- [ ] Should be running (triggered by publish)
- [ ] Wait for completion (~1 minute)
- [ ] Check **Code** tab → should see `main` branch updated

### Test Deploy to Staging (Workflow 3)
- [ ] Go to **Actions**
- [ ] Find **3️⃣ Deploy Tagged Release to Staging**
- [ ] Should be running (triggered by tag push)
- [ ] Wait for completion (~2-5 minutes)
- [ ] Check **Deployment Report** step for status
- [ ] Go to [Render Dashboard](https://dashboard.render.com)
- [ ] Check each service:
  - [ ] `devsecops-staging-frontend` - should show "Live"
  - [ ] `devsecops-staging-auth` - should show "Live"
  - [ ] `devsecops-staging-discord-notifier` - should show "Live"

### Test Health Checks
```bash
# From terminal or browser:
curl https://devsecops-staging-frontend.onrender.com/health
curl https://devsecops-staging-auth.onrender.com/health
curl https://devsecops-staging-discord-notifier.onrender.com/health
```

- [ ] All return 200 OK

## ✅ Step 6: Verify Staging Environment

- [ ] Visit frontend: https://devsecops-staging-frontend.onrender.com
- [ ] Check you can access the app
- [ ] Test login/auth flow
- [ ] Check API docs: https://devsecops-staging-auth.onrender.com/api-docs

## ✅ Step 7: Monitor Render Deployments

- [ ] Go to [Render Dashboard](https://dashboard.render.com)
- [ ] Click on each service
- [ ] Check **Logs** to see deployment history
- [ ] Check **Environment** to verify variables

## Troubleshooting

### Service shows "Build Failed"
- [ ] Check **Logs** on Render for error message
- [ ] Common causes: Missing env vars, Dockerfile error, Node version mismatch
- [ ] Fix issue and click **Redeploy**

### Health checks fail
- [ ] Wait a few more minutes (services may still be starting)
- [ ] Check if service has `/health` endpoint
- [ ] Verify environment variables are set on Render
- [ ] Check Render logs for runtime errors

### Can't reach staging URL
- [ ] Make sure service shows "Live" on Render dashboard
- [ ] Check if service is sleeping (free tier sleeps after 15 mins)
- [ ] Click service and then refresh the URL to wake it up

### Frontend can't reach Auth API
- [ ] Verify `VITE_API_URL` environment variable on frontend service
- [ ] Should be: `https://devsecops-staging-auth.onrender.com`
- [ ] Not: `http://localhost:3000`
- [ ] Redeploy frontend after fixing

## Cost

- **Free tier**: All 3 services can run free
- **Limitations**: Auto-sleep after 15 mins, 0.1 CPU, 512MB RAM
- **Upgrade**: $7/month per service for always-on

## Next Steps

1. After staging validated, create production services on Render
2. Add production deployment workflow (4️⃣ Deploy to Production)
3. Add manual approval gate before production
4. Set up production secrets separately

## Support

- [Render Docs](https://render.com/docs)
- [GitHub Secrets Help](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
