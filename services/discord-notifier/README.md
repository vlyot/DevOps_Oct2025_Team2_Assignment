# Discord Notifier Service

A standalone microservice for sending pipeline notifications to Discord via webhooks.

## Features

- **Rich Discord Embeds**: Beautiful formatted notifications with colors and fields
- **Role-Based Routing**: Send notifications to different channels based on status
  - Success: Admin + Stakeholder channels
  - Failure: Admin + Developer channels
- **Feature Flags**: Control which notifications are sent
- **Webhook Security**: Token-based authentication for incoming requests
- **Health Checks**: `/health` endpoint for container orchestration

## Quick Start

### 1. Setup Discord Webhooks

Create webhooks in your Discord server:
1. Go to Server Settings → Integrations → Webhooks
2. Create webhooks for each role:
   - `#devops-admin` - Admin notifications
   - `#devops-developers` - Developer notifications
   - `#devops-stakeholders` - Stakeholder notifications
3. Copy the webhook URLs

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
NODE_ENV=development

# Discord Webhook URLs
DISCORD_WEBHOOK_ADMIN=https://discord.com/api/webhooks/YOUR_ADMIN_WEBHOOK
DISCORD_WEBHOOK_DEVELOPER=https://discord.com/api/webhooks/YOUR_DEV_WEBHOOK
DISCORD_WEBHOOK_STAKEHOLDER=https://discord.com/api/webhooks/YOUR_STAKEHOLDER_WEBHOOK

# Generate with: openssl rand -base64 32
WEBHOOK_TOKEN=your-secure-random-token

# Feature Flags
DISCORD_ENABLED=true
SEND_PIPELINE_SUCCESS=false
SEND_PIPELINE_FAILURE=true
```

### 3. Run Locally

```bash
npm install
npm run dev
```

### 4. Run with Docker

```bash
docker-compose up discord-notifier
```

## API Endpoints

### POST /notify/pipeline

Send pipeline notification.

**Headers:**
- `Content-Type: application/json`
- `X-Webhook-Token: <your-token>`

**Body:**
```json
{
  "status": "success" | "failure",
  "workflowName": "CI Pipeline",
  "branch": "main",
  "commit": "abc1234",
  "actor": "username",
  "duration": "2m 30s",
  "runUrl": "https://github.com/.../runs/123",
  "timestamp": "2024-01-01T00:00:00Z",
  "failedServices": ["auth", "frontend"],
  "securityFindings": {
    "critical": 2,
    "high": 5,
    "medium": 10,
    "low": 3
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "discord-notifier",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
```

## GitHub Actions Integration

Add secrets to your repository:
- `DISCORD_NOTIFIER_URL`: URL of deployed service
- `WEBHOOK_TOKEN`: Shared authentication token

Example workflow:
```yaml
- name: Send Discord Notification
  run: |
    curl -X POST ${{ secrets.DISCORD_NOTIFIER_URL }}/notify/pipeline \
      -H "Content-Type: application/json" \
      -H "X-Webhook-Token: ${{ secrets.WEBHOOK_TOKEN }}" \
      -d '{
        "status": "success",
        "workflowName": "CI Pipeline",
        "branch": "${{ github.ref_name }}",
        "commit": "${{ github.sha }}",
        "actor": "${{ github.actor }}",
        "runUrl": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
      }'
```

## Architecture

```
GitHub Actions
    ↓ (webhook)
Discord Notifier Service
    ↓ (HTTP POST)
Discord API
    ↓
Discord Channels
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `DISCORD_WEBHOOK_ADMIN` | Yes* | Admin channel webhook URL |
| `DISCORD_WEBHOOK_DEVELOPER` | Yes* | Developer channel webhook URL |
| `DISCORD_WEBHOOK_STAKEHOLDER` | Yes* | Stakeholder channel webhook URL |
| `WEBHOOK_TOKEN` | Yes | Authentication token for incoming requests |
| `DISCORD_ENABLED` | No | Enable/disable Discord (default: true) |
| `SEND_PIPELINE_SUCCESS` | No | Send success notifications (default: false) |
| `SEND_PIPELINE_FAILURE` | No | Send failure notifications (default: true) |

*At least one webhook URL must be configured when `DISCORD_ENABLED=true`

## Security

- Webhook token authentication prevents unauthorized notifications
- Environment variables keep webhook URLs secure
- No sensitive data stored in code
- HTTPS recommended for production deployments

## Production Deployment

1. Build Docker image:
   ```bash
   docker build -t discord-notifier:latest .
   ```

2. Run container:
   ```bash
   docker run -p 3001:3001 --env-file .env discord-notifier:latest
   ```

3. Configure reverse proxy (nginx/traefik) with HTTPS
4. Set up monitoring and logging
5. Configure GitHub secrets with production URLs

## License

MIT
