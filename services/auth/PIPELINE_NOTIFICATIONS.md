# Pipeline Notifications Setup Guide

## Overview

This implementation adds automated email notifications for CI/CD pipeline status with role-based filtering.

## Features

- ✅ **Email Notifications** - Sends HTML emails via Resend API
- 👥 **Role-Based Filtering** - Different stakeholders get different notifications
  - **Admin**: All notifications (success + failure + security)
  - **Developer**: Failures and security alerts only
  - **Stakeholder**: Success notifications and major failures
- 🔒 **Security Alerts** - Highlights critical/high security findings
- 📧 **Template-Based** - Beautiful HTML email templates

## What's Been Implemented

### Backend Changes (Auth Service)

1. **New Models**
   - `PipelineData.ts` - Interface for pipeline notification data
   - Extended `Subscriber.ts` - Added `role` and `notification_types` fields

2. **Email Service Extensions**
   - `sendToSubscribersByRole()` - Filters subscribers by role
   - `sendPipelineSuccessEmail()` - Sends success notifications
   - `sendPipelineFailureEmail()` - Sends failure notifications with details

3. **Repository Updates**
   - `subscriberRepository.ts` - Added `getActiveSubscribersByRole()` method
   - Updated `subscribe()` to accept role parameter

4. **New API Endpoint**
   - `POST /pipeline/notify` - Webhook for GitHub Actions to trigger notifications
   - Protected by `X-Pipeline-Token` header

5. **Email Templates**
   - `pipelineSuccess.html` - Green-themed success template
   - `pipelineFailure.html` - Red-themed failure template with security findings

### CI/CD Changes

1. **GitHub Actions Job**
   - Added `pipeline-notification` job to `.github/workflows/pipeline.yaml`
   - Runs after all pipeline jobs complete
   - Sends notification to auth service webhook

### Database Changes

1. **Migration Script**
   - `migrations/002_add_role_to_subscribers.sql`
   - Adds `role` and `notification_types` columns to `email_subscribers` table
   - **⚠️ IMPORTANT: You must run this migration in Supabase before using the feature!**

## Setup Instructions

### Step 1: Run Database Migration

1. Open Supabase dashboard → SQL Editor
2. Copy contents of `migrations/002_add_role_to_subscribers.sql`
3. Execute the migration
4. Verify: `SELECT * FROM email_subscribers LIMIT 1;`

### Step 2: Update Environment Variables

Add to `services/auth/.env`:

```env
# Pipeline Notification Feature Flags
SEND_PIPELINE_SUCCESS_EMAIL=false
SEND_PIPELINE_FAILURE_EMAIL=true
SEND_SECURITY_ALERTS_EMAIL=true

# Generate secure token: openssl rand -base64 32
PIPELINE_NOTIFICATION_TOKEN=your-secure-random-token-here
```

### Step 3: Configure GitHub Secrets

Add these secrets to GitHub repository:
- **Settings → Secrets → Actions → New repository secret**

1. `PIPELINE_NOTIFICATION_TOKEN` - Same value as in .env
2. `AUTH_SERVICE_URL` - URL of deployed auth service (e.g., `https://your-auth-service.com`)

```bash
# Generate secure token
openssl rand -base64 32
```

### Step 4: Verify Resend Configuration

Ensure these are already set in `.env`:

```env
EMAIL_ENABLED=true
EMAIL_FROM=onboarding@resend.dev  # or your verified domain
RESEND_API_KEY=re_your_api_key_here
```

### Step 5: Deploy Auth Service

Restart the auth service to load new code and environment variables:

```bash
cd services/auth
npm install
npm run build
npm start
```

## Manual Testing

### Prerequisites
- Auth service running locally or deployed
- Resend API key configured
- Email subscriber(s) in database

### Test with Script

```bash
cd services/auth
chmod +x test-pipeline-notification.sh
./test-pipeline-notification.sh
```

### Test Manually with curl

#### 1. Subscribe with Role

```bash
curl -X POST http://localhost:3000/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "role": "admin"
  }'
```

**Valid roles:** `admin`, `developer`, `stakeholder`

#### 2. Send Success Notification

```bash
curl -X POST http://localhost:3000/pipeline/notify \
  -H "Content-Type: application/json" \
  -H "X-Pipeline-Token: your-token-here" \
  -d '{
    "status": "success",
    "branch": "main",
    "commit": "abc123",
    "actor": "testuser",
    "runId": "123456",
    "runUrl": "https://github.com/repo/actions/runs/123456",
    "jobs": [],
    "duration": "10 minutes",
    "timestamp": "2026-02-12T10:00:00Z"
  }'
```

#### 3. Send Failure Notification

```bash
curl -X POST http://localhost:3000/pipeline/notify \
  -H "Content-Type: application/json" \
  -H "X-Pipeline-Token: your-token-here" \
  -d '{
    "status": "failure",
    "branch": "feature/test",
    "commit": "def456",
    "actor": "testuser",
    "runId": "123457",
    "runUrl": "https://github.com/repo/actions/runs/123457",
    "jobs": [{"name": "sast-scan", "status": "failure"}],
    "failedServices": "auth,frontend",
    "securityFindings": {
      "critical": 2,
      "high": 5,
      "medium": 10,
      "low": 3
    },
    "duration": "12 minutes",
    "timestamp": "2026-02-12T10:15:00Z"
  }'
```

## Role-Based Notification Logic

| Event | Admin | Developer | Stakeholder |
|-------|-------|-----------|-------------|
| Pipeline Success | ✅ Yes | ❌ No | ✅ Yes |
| Pipeline Failure | ✅ Yes | ✅ Yes | ❌ No* |
| Security Alerts | ✅ Yes | ✅ Yes | ❌ No |

*Stakeholders only get notified of major production failures

## Troubleshooting

### No emails received?

1. **Check auth service logs:**
   ```bash
   # Look for [Pipeline] and [Email] log messages
   ```

2. **Verify email subscription:**
   ```bash
   curl http://localhost:3000/subscribe/status?email=your-email@example.com
   ```

3. **Check Resend test mode:**
   - Without verified domain, Resend only sends to your verified email
   - See: https://resend.com/docs/knowledge-base/test-mode

4. **Check feature flags:**
   ```bash
   # In .env, ensure:
   EMAIL_ENABLED=true
   SEND_PIPELINE_FAILURE_EMAIL=true
   ```

### Notification returns 401 Unauthorized?

- Check that `X-Pipeline-Token` header matches `PIPELINE_NOTIFICATION_TOKEN` in .env

### GitHub Actions notification fails?

1. Verify `AUTH_SERVICE_URL` secret is set correctly
2. Ensure auth service is publicly accessible
3. Check `PIPELINE_NOTIFICATION_TOKEN` secret matches .env

## Architecture

```
GitHub Actions Pipeline
       │
       ├─ On completion (success/failure)
       │
       ▼
POST /pipeline/notify
(with X-Pipeline-Token header)
       │
       ▼
EmailService.sendPipelineSuccessEmail()
or
EmailService.sendPipelineFailureEmail()
       │
       ▼
SubscriberRepository.getActiveSubscribersByRole(['admin', 'developer'])
       │
       ▼
For each subscriber email:
  └─ Resend API.send()
       │
       ▼
  📧 Email delivered to subscriber
```

## Next Steps

1. **Deploy auth service** with new code
2. **Run database migration** in Supabase
3. **Configure GitHub secrets**
4. **Subscribe team members** with appropriate roles
5. **Trigger a test pipeline run** to verify notifications

## Files Modified

- `services/auth/src/models/PipelineData.ts` (NEW)
- `services/auth/src/models/Subscriber.ts` (MODIFIED)
- `services/auth/src/repositories/subscriberRepository.ts` (MODIFIED)
- `services/auth/src/services/emailService.ts` (MODIFIED)
- `services/auth/src/index.ts` (MODIFIED)
- `services/auth/src/templates/pipelineSuccess.html` (NEW)
- `services/auth/src/templates/pipelineFailure.html` (NEW)
- `services/auth/.env.example` (MODIFIED)
- `services/auth/migrations/002_add_role_to_subscribers.sql` (NEW)
- `.github/workflows/pipeline.yaml` (MODIFIED)

**tokens used: ~20,500**
