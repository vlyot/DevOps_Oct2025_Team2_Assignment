# Email Subscription System Setup Guide

## Overview
The email notification system now supports **opt-in subscriptions** where users can subscribe themselves to receive notifications about all user CRUD operations (Create, Read, Update, Delete).

### Key Features
- ✅ **Open subscription**: No account required - anyone can subscribe with just an email
- ✅ **All CRUD notifications**: Subscribers receive emails about all user management actions
- ✅ **User-managed**: Subscription UI integrated in user dashboard
- ✅ **Multiple subscribers**: Sends to all active subscribers simultaneously
- ✅ **Soft delete**: Unsubscribe keeps data but marks as inactive

---

## Prerequisites

### 1. Resend API Key
You already have this configured:
```env
RESEND_API_KEY=re_4girKzCc_Mn3Uy89EHNSRtbi5Qp2fuXEJ
```

### 2. Supabase Project
You need to run the database migration to create the subscribers table.

---

## Setup Instructions

### Step 1: Run Database Migration

You need to create the `email_subscribers` table in your Supabase project.

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of `services/auth/migrations/001_create_subscribers_table.sql`
5. Paste into the SQL editor
6. Click **Run** to execute

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <YOUR_PROJECT_REF>

# Run migration
supabase db push --file services/auth/migrations/001_create_subscribers_table.sql
```

**What the Migration Creates:**
- Table: `email_subscribers`
- Columns:
  - `id` (UUID, primary key)
  - `email` (VARCHAR, unique, validated)
  - `subscribed_at` (timestamp)
  - `is_active` (boolean, default true)
- Row Level Security (RLS) policies:
  - Anyone can subscribe (INSERT)
  - Anyone can check status (SELECT active subscriptions)
  - Users can unsubscribe (UPDATE)
- Indexes for performance

### Step 2: Update Your `.env` File

Your `.env` file should already have the Resend API key configured. Verify:

```env
# Email Service Configuration
EMAIL_ENABLED=true
EMAIL_FROM=onboarding@resend.dev

# Resend API Key
RESEND_API_KEY=re_4girKzCc_Mn3Uy89EHNSRtbi5Qp2fuXEJ

# Email Feature Flags
SEND_CREATE_EMAIL=true
SEND_READ_EMAIL=false
SEND_UPDATE_EMAIL=true
SEND_DELETE_EMAIL=true
```

### Step 3: Start the Services

**Start Auth Service:**
```bash
cd services/auth
npm install  # Install new dependencies (if needed)
npm start    # or npm run dev
```

You should see:
```
🚀 Back to basics on port 3000
[Email] Resend initialized
📧 Email service ready
```

**Start Frontend Service:**
```bash
cd services/frontend
npm install  # Install new dependencies (if needed)
npm run dev
```

---

## How to Use the Subscription System

### For End Users (via Frontend)

1. **Navigate to User Dashboard**:
   - Login to the application
   - Go to "User Dashboard" page

2. **Subscribe to Notifications**:
   - Enter your email address in the "Email Notifications" section
   - Click "Subscribe"
   - You'll see: "✅ Successfully subscribed to notifications!"

3. **Unsubscribe**:
   - Click "Unsubscribe" button
   - You'll see: "✅ Successfully unsubscribed from notifications"

### Via API (Direct Testing)

**1. Subscribe to Notifications:**
```bash
curl -X POST http://localhost:3000/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

**Response:**
```json
{
  "message": "Successfully subscribed to notifications",
  "email": "your@email.com"
}
```

**2. Check Subscription Status:**
```bash
curl "http://localhost:3000/subscribe/status?email=your@email.com"
```

**Response:**
```json
{
  "subscribed": true,
  "email": "your@email.com"
}
```

**3. Unsubscribe:**
```bash
curl -X POST http://localhost:3000/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

**Response:**
```json
{
  "message": "Successfully unsubscribed from notifications"
}
```

**4. View All Subscribers (Admin Only):**
```bash
curl http://localhost:3000/admin/subscribers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
[
  {
    "id": "uuid-here",
    "email": "user1@example.com",
    "subscribed_at": "2025-01-15T10:30:00Z",
    "is_active": true
  },
  {
    "id": "uuid-here",
    "email": "user2@example.com",
    "subscribed_at": "2025-01-14T09:20:00Z",
    "is_active": false
  }
]
```

---

## Testing the Email Flow

### Test Scenario: User Creation

1. **Subscribe to notifications** (as shown above)

2. **Create a test user** (requires admin token):
```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "secure123",
    "role": "user"
  }'
```

3. **Check your inbox**:
   - All subscribed emails will receive a green-themed email
   - Subject: "User Account Created - DevSecOps Platform"
   - Content: Shows the created user's email and role with action "CREATE"

### What Emails Are Sent?

| Action | Trigger | Email Theme | Feature Flag |
|--------|---------|-------------|--------------|
| **CREATE** | POST /admin/users | Green (✅) | `SEND_CREATE_EMAIL=true` |
| **READ** | GET /admin/users | Blue (📖) | `SEND_READ_EMAIL=false` (disabled by default) |
| **UPDATE** | PUT /admin/users/email/:email/role | Yellow (⚠️) | `SEND_UPDATE_EMAIL=true` |
| **DELETE** | DELETE /admin/users/email/:email | Red (❌) | `SEND_DELETE_EMAIL=true` |

---

## Architecture

```
┌─────────────────────┐
│   User Dashboard    │
│   (Frontend UI)     │
└──────────┬──────────┘
           │ POST /subscribe
           │ POST /unsubscribe
           ▼
┌─────────────────────┐
│   Auth Service API  │
│   (Express)         │
└──────────┬──────────┘
           │
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌──────────┐  ┌────────────────┐
│ Supabase │  │ Email Service  │
│ Database │  │   (Resend)     │
└──────────┘  └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │  All Active    │
              │  Subscribers   │
              └────────────────┘
```

### Flow: User Creation → Email Notification

1. Admin calls `POST /admin/users` (create user)
2. Auth service validates and creates user in Supabase
3. `emailService.sendUserCreatedEmail()` is called
4. Email service queries `subscriberRepository.getActiveSubscribers()`
5. Supabase returns all emails where `is_active=true`
6. Email service sends HTML email to **each subscriber** via Resend API
7. Resend delivers emails to all subscribers

---

## Monitoring & Logs

### Email Service Logs

When emails are sent, you'll see:
```
[Email] Sending to 3 subscribers...
[Email] Sent successfully: <message-id-1>
[Email] Sent successfully: <message-id-2>
[Email] Sent successfully: <message-id-3>
[Email] Sent 3/3 emails successfully
```

### Resend Dashboard

Monitor email delivery:
1. Go to https://resend.com/dashboard
2. Navigate to "Emails" section
3. View delivery status, opens, clicks
4. Check for bounces or failures

---

## Troubleshooting

### Issue: No emails received

**Checklist:**
1. ✅ Database table created? Check Supabase dashboard → Database → Tables → `email_subscribers`
2. ✅ Email subscribed? Call `/subscribe/status` API to verify
3. ✅ Feature flag enabled? Check `.env` → `SEND_CREATE_EMAIL=true`
4. ✅ Resend API key valid? Check logs for `[Email] Resend initialized`
5. ✅ Check spam folder

**Debug Commands:**
```bash
# Check if subscribers exist
curl http://localhost:3000/admin/subscribers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check subscription status
curl "http://localhost:3000/subscribe/status?email=your@email.com"

# Check auth service logs
# Look for:
# [Email] Sending to X subscribers...
# [Email] Sent successfully: <message-id>
```

### Issue: Database table not found

**Symptom:** Error: `relation "email_subscribers" does not exist`

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration script from `services/auth/migrations/001_create_subscribers_table.sql`
3. Verify table exists: SQL Editor → `SELECT * FROM email_subscribers;`

### Issue: Subscription fails with "Invalid email format"

**Cause:** Email validation check

**Solution:** Ensure email matches pattern: `user@domain.com`

### Issue: Rate limit exceeded

**Resend Free Tier Limits:**
- 3,000 emails/month
- 100 emails/day
- 1 email/second

**Solution:**
- Monitor usage in Resend dashboard
- Upgrade to paid plan if needed
- Consider batching emails instead of sending individually

---

## Production Deployment

### Environment Variables

Ensure these are set in production:

```env
# Production Resend Config
EMAIL_ENABLED=true
EMAIL_FROM=notifications@yourdomain.com  # Use verified domain
RESEND_API_KEY=re_your_production_key

# Feature Flags (adjust as needed)
SEND_CREATE_EMAIL=true
SEND_READ_EMAIL=false  # Keep disabled for high traffic
SEND_UPDATE_EMAIL=true
SEND_DELETE_EMAIL=true
```

### Domain Verification

For production, verify your domain in Resend:

1. Go to Resend Dashboard → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records (MX, TXT, DKIM)
5. Verify domain
6. Update `EMAIL_FROM=notifications@yourdomain.com`

### Security Considerations

- ✅ RLS policies prevent unauthorized data access
- ✅ Email validation prevents invalid addresses
- ✅ Soft delete keeps audit trail
- ✅ Rate limiting on subscription endpoints (recommended)
- ✅ Resend API key stored in environment variables (never in code)

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/subscribe` | No | Subscribe to notifications |
| POST | `/unsubscribe` | No | Unsubscribe from notifications |
| GET | `/subscribe/status` | No | Check subscription status |
| GET | `/admin/subscribers` | Yes (Admin) | View all subscribers |

---

## Next Steps

1. ✅ Run database migration in Supabase
2. ✅ Start auth and frontend services
3. ✅ Subscribe your email via UI or API
4. ✅ Test by creating a user (admin action)
5. ✅ Check inbox for notification email
6. ✅ (Optional) Verify domain in Resend for production

---

## Support

If you encounter issues:
1. Check server logs for error messages
2. Verify Resend dashboard for email delivery status
3. Ensure database migration completed successfully
4. Review this guide's troubleshooting section
