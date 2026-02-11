# Email Notification Service

## Overview
The auth service includes an integrated email notification system that sends notifications to administrators for all user CRUD operations (Create, Read, Update, Delete). This provides an audit trail and real-time awareness of user management actions.

## Features
- **CREATE**: Email sent when a new user account is created
- **READ**: Email sent when admin queries user information (optional, disabled by default)
- **UPDATE**: Email sent when a user's role is changed
- **DELETE**: Email sent before a user account is deleted

All emails are sent to: `s10259894A@connect.np.edu.sg`

## Configuration

### Environment Variables

Add these variables to your `services/auth/.env` file:

```env
# Email Service Configuration
EMAIL_ENABLED=true
EMAIL_FROM=onboarding@resend.dev
ADMIN_NOTIFICATION_EMAIL=s10259894A@connect.np.edu.sg

# Resend API Configuration (Free Tier: 3,000 emails/month)
# Sign up at: https://resend.com/signup
# Get your API key from: https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here

# Email Feature Flags
SEND_CREATE_EMAIL=true
SEND_READ_EMAIL=false
SEND_UPDATE_EMAIL=true
SEND_DELETE_EMAIL=true
```

### Resend Setup (Free Tier - Recommended)

**Why Resend?**
- ✅ 3,000 emails per month free
- ✅ Simple API key setup (no SMTP configuration)
- ✅ Excellent deliverability
- ✅ No Gmail account or 2FA required

**Setup Steps:**

1. **Sign up for Resend**:
   - Go to [https://resend.com/signup](https://resend.com/signup)
   - Create an account (free)

2. **Get your API Key**:
   - After login, go to [API Keys](https://resend.com/api-keys)
   - Click "Create API Key"
   - Name it "DevSecOps Platform"
   - Copy the API key (starts with `re_`)

3. **Update Environment Variables**:
   ```env
   RESEND_API_KEY=re_your_actual_api_key_here
   EMAIL_FROM=onboarding@resend.dev
   ```

**Important Notes:**
- Use `onboarding@resend.dev` for testing (Resend's test domain)
- For production, add and verify your own domain in Resend dashboard
- Free tier includes 3,000 emails/month, 100 emails/day

## Email Templates

Located in `services/auth/src/templates/`:

- **userCreated.html**: Green-themed email for account creation (CREATE)
- **userRead.html**: Blue-themed email for account access (READ)
- **userUpdated.html**: Yellow-themed email for role changes (UPDATE)
- **userDeleted.html**: Red-themed email for account deletion (DELETE)

Each template includes:
- Clear action indicator (CREATE/READ/UPDATE/DELETE)
- User email
- Timestamp (rendered in HTML)
- Relevant details (role, changes, etc.)

## API Integration

Email notifications are automatically triggered by these endpoints:

### 1. Create User (POST /admin/users)
```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"secure123","role":"user"}'
```
**Email Sent**: User Created (if `SEND_CREATE_EMAIL=true`)

### 2. List Users (GET /admin/users)
```bash
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Email Sent**: User Accessed (if `SEND_READ_EMAIL=true`)

### 3. Update User Role (PUT /admin/users/email/:email/role)
```bash
curl -X PUT http://localhost:3000/admin/users/email/user@example.com/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```
**Email Sent**: User Updated (if `SEND_UPDATE_EMAIL=true`)

### 4. Delete User (DELETE /admin/users/email/:email)
```bash
curl -X DELETE http://localhost:3000/admin/users/email/user@example.com \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Email Sent**: User Deleted (if `SEND_DELETE_EMAIL=true`)

## Testing

### Manual Testing
1. Configure Resend API key in `.env`:
   ```env
   EMAIL_ENABLED=true
   EMAIL_FROM=onboarding@resend.dev
   ADMIN_NOTIFICATION_EMAIL=s10259894A@connect.np.edu.sg
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

2. Start auth service:
   ```bash
   cd services/auth
   npm start
   ```

3. Look for email service status in logs:
   ```
   🚀 Back to basics on port 3000
   [Email] Resend initialized
   ```

4. Create a test user and check your inbox at `s10259894A@connect.np.edu.sg`:
   ```bash
   curl -X POST http://localhost:3000/admin/users \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","role":"user"}'
   ```

### Unit Testing
```bash
cd services/auth
npm test -- emailService.test.ts
```

Tests cover:
- Service initialization
- SMTP connection verification
- Email sending (success and failure)
- All CRUD notification types
- Template loading with fallback

## Troubleshooting

### Email service disabled
**Symptom**: Log shows "Email service disabled"
**Solution**: Set `EMAIL_ENABLED=true` in `.env`

### Resend API key missing
**Symptom**: Log shows "EMAIL_ENABLED is true but RESEND_API_KEY is missing"
**Solution**:
1. Get API key from [https://resend.com/api-keys](https://resend.com/api-keys)
2. Add to `.env` file: `RESEND_API_KEY=re_your_key_here`

### Emails not received
**Check**:
1. Spam folder at `s10259894A@connect.np.edu.sg`
2. Server logs for email sending confirmation: `[Email] Sent successfully: <message-id>`
3. Feature flags are enabled (e.g., `SEND_CREATE_EMAIL=true`)
4. Resend API key is valid and not expired
5. Check Resend dashboard for email delivery status

### API Key invalid
**Symptom**: Error message about invalid API key
**Solution**:
1. Verify API key starts with `re_`
2. Check for extra spaces or quotes in `.env` file
3. Create a new API key if old one was deleted

### Rate Limiting
Resend free tier limits:
- 3,000 emails per month
- 100 emails per day
- 1 email per second

**Solution**: Monitor usage in Resend dashboard, upgrade to paid plan if needed

## Docker Deployment

The email service is automatically included in Docker containers:

1. **Build**: Templates are copied during Docker build
2. **Configure**: Environment variables are passed via `.env` file
3. **Run**: Email service initializes on container startup

```bash
# Build and start with Docker Compose
docker-compose up --build

# Check logs
docker logs devsecops-auth
```

## Security Best Practices

1. **Never commit real credentials**:
   - Use `.env` file (already in `.gitignore`)
   - Rotate SMTP passwords regularly

2. **Production Setup**:
   - Use dedicated SMTP service (AWS SES, SendGrid)
   - Enable TLS/SSL
   - Monitor email sending rates

3. **PII Protection**:
   - Emails contain user emails for audit purposes
   - Ensure notification inbox (`s10259894A@connect.np.edu.sg`) is secured
   - Consider encryption for sensitive data

## Architecture

```
┌─────────────────┐
│  Auth Service   │
│  (Express API)  │
└────────┬────────┘
         │
         ├─ POST /admin/users ────────┐
         ├─ GET /admin/users ─────────┤
         ├─ PUT /admin/users/:id ─────┤ Trigger Email
         └─ DELETE /admin/users/:id ──┘
                  │
         ┌────────▼─────────┐
         │  Email Service   │
         │  (Singleton)     │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │   Resend API     │
         │   (REST Client)  │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │  Resend Service  │
         │  resend.com      │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │ Administrator    │
         │ s10259894A@...   │
         └──────────────────┘
```

## Monitoring

Monitor email service health:

1. **Startup Logs**:
   ```
   📧 Email service ready  ← Good
   ⚠️  Email service configured but connection failed  ← Check credentials
   📧 Email service disabled  ← Enable if needed
   ```

2. **Email Sending Logs**:
   ```
   [Email] Sent successfully: <message-id>
   [Email] Failed to send: Error: ...
   ```

3. **Feature Flag Status**:
   - Check which notifications are enabled
   - Verify admin notification email is correct

## Sprint Completion

This implementation completes:
- **SCRUM-55**: Setup Email Notification Service
  - ✅ Resend API integration
  - ✅ Simple API key configuration (no SMTP setup)
  - ✅ Four email templates (CREATE/READ/UPDATE/DELETE)
  - ✅ Integration with all admin endpoints
  - ✅ Feature flags for granular control
  - ✅ Unit tests (13+ passing tests)
  - ✅ Docker support
  - ✅ Comprehensive documentation
  - ✅ Free tier: 3,000 emails/month
