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
EMAIL_FROM_NAME=DevSecOps Platform
ADMIN_NOTIFICATION_EMAIL=s10259894A@connect.np.edu.sg

# Gmail SMTP Configuration (Free Tier)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password

# Email Feature Flags
SEND_CREATE_EMAIL=true
SEND_READ_EMAIL=false
SEND_UPDATE_EMAIL=true
SEND_DELETE_EMAIL=true
```

### Gmail Setup (Free Tier)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate an App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "DevSecOps Platform"
   - Copy the 16-character password

3. **Update Environment Variables**:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # The 16-character app password
   ```

### Alternative SMTP Providers

#### SendGrid (Free Tier: 100 emails/day)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### AWS SES (Very cheap: $0.10 per 1000 emails)
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```

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
1. Configure Gmail credentials in `.env`:
   ```env
   EMAIL_ENABLED=true
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-app-password
   ```

2. Start auth service:
   ```bash
   cd services/auth
   npm start
   ```

3. Look for email service status in logs:
   ```
   🚀 Back to basics on port 3000
   📧 Email service ready
   ```

4. Create a test user and check your inbox at `s10259894A@connect.np.edu.sg`

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
**Symptom**: Log shows "📧 Email service disabled"
**Solution**: Set `EMAIL_ENABLED=true` in `.env`

### Connection failed
**Symptom**: Log shows "⚠️ Email service configured but connection failed"
**Possible Causes**:
1. Invalid SMTP credentials
2. 2FA not enabled on Gmail (required for app passwords)
3. Firewall blocking port 587
4. Incorrect SMTP host/port

**Solution**:
```bash
# Test SMTP connection manually
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your@gmail.com', pass: 'your-app-password' }
});
transport.verify().then(console.log).catch(console.error);
"
```

### Emails not received
**Check**:
1. Spam folder at `s10259894A@connect.np.edu.sg`
2. Server logs for email sending confirmation
3. Feature flags are enabled (e.g., `SEND_CREATE_EMAIL=true`)
4. Gmail daily sending limit (500 emails/day)

### Rate Limiting
Gmail free tier has rate limits:
- 500 emails per day
- 500 recipients per day

**Solution**: Use AWS SES or SendGrid for production

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
         │   Nodemailer     │
         │   (SMTP Client)  │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │   Gmail SMTP     │
         │  smtp.gmail.com  │
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
  - ✅ Nodemailer integration
  - ✅ Gmail SMTP configuration
  - ✅ Four email templates (CREATE/READ/UPDATE/DELETE)
  - ✅ Integration with all admin endpoints
  - ✅ Feature flags for granular control
  - ✅ Unit tests (13+ passing tests)
  - ✅ Docker support
  - ✅ Comprehensive documentation
