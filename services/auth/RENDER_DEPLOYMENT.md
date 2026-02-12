# Deploying Auth Service to Render

This guide walks you through deploying the auth service to Render's free tier.

## Prerequisites

- GitHub account (your repository must be pushed to GitHub)
- Render account (sign up at https://render.com)
- Supabase database already set up

## Step 1: Push Your Code to GitHub

Make sure all your changes are committed and pushed:

```bash
git add .
git commit -m "Add pipeline notification system"
git push origin feature/email-notification-service
```

## Step 2: Create Render Account

1. Go to https://render.com
2. Click **Get Started**
3. Sign up with GitHub (recommended for easy deployment)

## Step 3: Create a New Web Service

1. In Render dashboard, click **New +** → **Web Service**
2. Connect your GitHub repository
3. Select your repository: `DevOps_Oct2025_Team2_Assignment`
4. Click **Connect**

## Step 4: Configure the Web Service

Fill in the following settings:

### Basic Settings

- **Name**: `auth-service` (or any name you prefer)
- **Region**: Choose closest to you (e.g., Singapore, Oregon)
- **Branch**: `feature/email-notification-service` (or `main` if merged)
- **Root Directory**: `services/auth`
- **Runtime**: `Docker`

### Build Settings

Since we're using Docker, Render will automatically detect the Dockerfile.

- **Dockerfile Path**: `services/auth/Dockerfile` (auto-detected)

### Instance Type

- **Instance Type**: `Free` (select the free tier)

**Note:** Free tier limitations:
- 512 MB RAM
- Sleeps after 15 minutes of inactivity
- Takes ~30 seconds to wake up on first request

## Step 5: Add Environment Variables

Click **Advanced** → **Add Environment Variable** and add the following:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | Default port |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | From your Supabase project |
| `SUPABASE_ANON_KEY` | `eyJxxxx...` | From Supabase project settings |
| `JWT_SECRET` | `your-jwt-secret-min-32-chars` | Generate a secure random string |
| `EMAIL_ENABLED` | `true` | Enable email notifications |
| `EMAIL_FROM` | `onboarding@resend.dev` | Or your verified domain |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` | From Resend dashboard |
| `SEND_PIPELINE_SUCCESS_EMAIL` | `false` | Set to `true` if you want success emails |
| `SEND_PIPELINE_FAILURE_EMAIL` | `true` | Enable failure notifications |
| `SEND_SECURITY_ALERTS_EMAIL` | `true` | Enable security alerts |
| `SEND_CREATE_EMAIL` | `true` | User creation emails |
| `SEND_UPDATE_EMAIL` | `true` | User update emails |
| `SEND_DELETE_EMAIL` | `true` | User deletion emails |

### How to Find Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

### How to Get Resend API Key

1. Go to https://resend.com/api-keys
2. Click **Create API Key**
3. Name: `Production Auth Service`
4. Permission: **Sending access**
5. Copy the key (starts with `re_`)

## Step 6: Deploy

1. Click **Create Web Service**
2. Render will start building your Docker container
3. Wait 3-5 minutes for the build to complete
4. Once deployed, you'll see **"Your service is live 🎉"**

## Step 7: Get Your Service URL

After deployment, your service will be available at:

```
https://auth-service.onrender.com
```

(Replace `auth-service` with whatever name you chose)

Copy this URL - you'll need it for GitHub secrets!

## Step 8: Test Your Deployment

Test the health endpoint:

```bash
curl https://auth-service.onrender.com/health
```

Expected response:
```json
{"status":"ok"}
```

Test the subscribe endpoint:

```bash
curl -X POST https://auth-service.onrender.com/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"developer"}'
```

## Step 9: Configure GitHub Secret

Now that your auth service is deployed, add the URL to GitHub:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AUTH_SERVICE_URL`
5. Value: `https://auth-service.onrender.com` (your actual URL)
6. Click **Add secret**

## Step 10: Verify Pipeline Integration

1. Push a commit to trigger the pipeline
2. Go to **Actions** tab in GitHub
3. Watch the `pipeline-notification` job
4. Check if subscribers receive emails

## Troubleshooting

### Service Won't Start

Check the logs in Render dashboard:
- Click on your service
- Go to **Logs** tab
- Look for error messages

Common issues:
- Missing environment variables
- Invalid Supabase credentials
- Invalid Resend API key

### Build Failed

- Ensure Dockerfile is in `services/auth/`
- Check that all dependencies are in `package.json`
- Verify TypeScript compiles locally: `npm run build`

### Emails Not Sending

1. Check Render logs for email errors
2. Verify `EMAIL_ENABLED=true`
3. Check Resend dashboard for delivery logs
4. Ensure `RESEND_API_KEY` is correct
5. For free Resend accounts, emails only go to verified email addresses

### Pipeline Notification Returns 404

- Ensure service is deployed and running
- Check `AUTH_SERVICE_URL` GitHub secret is correct
- Test endpoint manually: `curl https://your-service.onrender.com/pipeline/notify`

### Free Tier Sleeping Issues

Render's free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

**Workaround options:**
1. Upgrade to paid tier ($7/month for always-on)
2. Use a cron job to ping the service every 10 minutes
3. Accept the delay (fine for a school project)

## Monitoring

### View Logs

1. Go to Render dashboard
2. Click your service
3. Click **Logs** tab
4. Real-time logs appear here

### Metrics

Click **Metrics** tab to see:
- CPU usage
- Memory usage
- Request counts
- Response times

## Updating Your Service

When you push new code to GitHub:

1. Render automatically detects the push
2. Rebuilds the Docker container
3. Deploys the new version (2-3 minutes)

You can also trigger manual deploys:
- Go to service dashboard
- Click **Manual Deploy** → **Deploy latest commit**

## Cost

**Free Tier Includes:**
- 750 hours/month (enough for 1 always-on service)
- 512 MB RAM
- Automatic HTTPS
- Auto-deploys from GitHub

**No credit card required for free tier!**

## Next Steps

Once deployed:
1. ✅ Test pipeline notifications manually
2. ✅ Trigger a real pipeline run
3. ✅ Verify subscribers receive emails
4. ✅ Monitor Render logs for any issues

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Resend Docs: https://resend.com/docs

---

Your auth service is now live and ready to receive pipeline notifications from GitHub Actions! 🚀
