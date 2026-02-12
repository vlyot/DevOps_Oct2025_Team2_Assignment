# Deployment Guide - GitHub Native

**The EASIEST CI/CD pipeline: Everything in GitHub, zero infrastructure.**

## Overview

```
1. Write code & push to develop
   ↓
2. ✅ Tests Run Automatically
   ↓
3. 📦 Draft Release Created
   ↓
4. 👥 Team Approves (Publish Release)
   ↓
5. ✅ Auto-Merge to main
   ↓
6. 🏷️ Auto-Tag with version
   ↓
7. ✅ Verify all services build successfully
   ↓
8. 📋 Deployment Report Generated
   ↓
🎉 READY FOR MANUAL DEPLOYMENT!
```

## No Setup Required ✅

- No servers needed
- No Docker Hub account
- No SSH keys
- No infrastructure
- **Just GitHub!**

## How It Works

### Step 1: Developer Pushes Code

```bash
git push origin develop
```

### Step 2: Workflow 1 Runs Automatically

- ✅ Installs dependencies
- ✅ Runs tests
- ✅ Generates coverage report
- ✅ Creates draft release
- **Takes ~3 minutes**

### Step 3: Team Reviews & Approves

Go to GitHub → **Releases**

Find draft release → Click **Publish release**

This triggers Workflow 2.

### Step 4: Workflow 2 Runs Automatically

- ✅ Merges develop → main
- ✅ Creates version tag
- **Takes ~1 minute**

This triggers Workflow 3.

### Step 5: Workflow 3 Verifies Everything

- ✅ Installs all dependencies
- ✅ Builds all services (frontend, auth, discord-notifier)
- ✅ Generates deployment report
- **Takes ~2 minutes**

### Step 6: Manual Deployment (Optional)

If you want to run staging locally:

```bash
# Terminal 1: Auth Service
cd services/auth
npm install
npm start

# Terminal 2: Frontend
cd services/frontend
npm install
npm run dev

# Terminal 3: Discord Notifier
cd services/discord-notifier
npm install
npm start
```

Then visit: http://localhost:5173 (frontend)

## Complete Workflow Timeline

| Step | Duration | Auto/Manual |
|------|----------|-------------|
| Push to develop | 0 min | Manual |
| Tests + Draft | 3 min | Auto |
| Publish release | 3 min | Manual |
| Merge + Tag | 1 min | Auto |
| Verify build | 2 min | Auto |
| **TOTAL** | **~9 min** | |

## Monitoring

### Watch GitHub Actions

1. Go to repo → **Actions**
2. See all three workflows:
   - **1️⃣ Build & Test** (tests & coverage)
   - **2️⃣ Approval & Merge** (merge to main + tag)
   - **3️⃣ Deploy to Staging** (verification)

### Check Deployment Report

Click on Workflow 3 → find **"📊 Deployment Report"** step

Shows exactly what was verified and status.

## When Code Fails

### Tests Fail

Workflow 1 stops. Fix the code:

```bash
# Fix the issue locally
git add .
git commit -m "fix: resolve test failure"
git push origin develop

# Workflow 1 runs again with your fix
```

### Build Fails

Workflow 3 shows the build error. Fix it:

```bash
# Test build locally
cd services/auth
npm install
npm run build

# Fix the issue, commit and push
git push origin develop
```

## FAQ

**Q: Is my code actually deployed?**
A: No - this workflow verifies everything builds. For real deployment, you'd set up your own server and pull the code.

**Q: Can I deploy to a real server?**
A: Yes! See "Advanced Deployment" below.

**Q: What if I want to deploy to Render/AWS/etc?**
A: Add a 4th workflow that does that. This keeps staging simple.

## Advanced: Deploy to Your Own Server

If you have a Linux server, add this step to Workflow 3:

```yaml
- name: 🚀 Deploy to my server
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    ssh-keyscan ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts

    ssh -i ~/.ssh/id_rsa ${{ secrets.SSH_USER }}@${{ secrets.SERVER_HOST }} << 'EOF'
    cd ~/my-app
    git pull origin main
    npm install
    npm start &
    EOF
```

Then add 3 GitHub Secrets:
- `SSH_PRIVATE_KEY` - your SSH private key
- `SSH_USER` - your username (e.g., `deploy`)
- `SERVER_HOST` - your server IP/hostname

## Production Deployment

To deploy to production (after staging validated):

Create a new workflow `4-deploy-production.yml` that:
1. Adds a manual trigger
2. Deploys to a different server
3. Same pattern as staging

## Summary

✅ **Easiest CI/CD ever**
- No infrastructure needed
- All code verified
- Ready for manual deployment
- Can scale to real servers later

**Total setup time: 0 minutes** (uses GitHub defaults)

**To get started:** Just push to develop and publish the draft release!
