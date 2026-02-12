#!/bin/bash
# Test script for pipeline notification system
# Usage: ./test-pipeline-notification.sh

echo "=== Pipeline Notification Test Script ==="
echo ""

# Set auth service URL (update this to your deployed URL)
AUTH_URL="${AUTH_SERVICE_URL:-http://localhost:3000}"

# Generate a test token (or use your actual token from .env)
NOTIFICATION_TOKEN="${PIPELINE_NOTIFICATION_TOKEN:-test-token-12345}"

echo "Using Auth Service URL: $AUTH_URL"
echo "Using Notification Token: ${NOTIFICATION_TOKEN:0:10}..."
echo ""

# Test 1: Subscribe an email with role
echo "Test 1: Subscribe an admin email"
curl -X POST "$AUTH_URL/subscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "role": "admin"
  }' | jq .
echo ""

# Test 2: Subscribe a developer email
echo "Test 2: Subscribe a developer email"
curl -X POST "$AUTH_URL/subscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "role": "developer"
  }' | jq .
echo ""

# Test 3: Send a success notification
echo "Test 3: Send pipeline success notification"
curl -X POST "$AUTH_URL/pipeline/notify" \
  -H "Content-Type: application/json" \
  -H "X-Pipeline-Token: $NOTIFICATION_TOKEN" \
  -d '{
    "status": "success",
    "branch": "feature/test",
    "commit": "abc1234567890",
    "actor": "testuser",
    "runId": "123456",
    "runUrl": "https://github.com/test/repo/actions/runs/123456",
    "jobs": [
      {"name": "devsecops-pipeline", "status": "success"},
      {"name": "sast-scan", "status": "success"}
    ],
    "duration": "10 minutes",
    "timestamp": "2026-02-12T10:00:00Z"
  }' | jq .
echo ""

# Test 4: Send a failure notification with security findings
echo "Test 4: Send pipeline failure notification with security findings"
curl -X POST "$AUTH_URL/pipeline/notify" \
  -H "Content-Type: application/json" \
  -H "X-Pipeline-Token: $NOTIFICATION_TOKEN" \
  -d '{
    "status": "failure",
    "branch": "feature/test",
    "commit": "def4567890123",
    "actor": "testuser",
    "runId": "123457",
    "runUrl": "https://github.com/test/repo/actions/runs/123457",
    "jobs": [
      {"name": "devsecops-pipeline", "status": "failure"},
      {"name": "sast-scan", "status": "failure"}
    ],
    "failedServices": "auth,frontend",
    "securityFindings": {
      "critical": 2,
      "high": 5,
      "medium": 10,
      "low": 3
    },
    "duration": "12 minutes",
    "timestamp": "2026-02-12T10:15:00Z"
  }' | jq .
echo ""

echo "=== Tests Complete ==="
echo "Check your email inbox for notifications!"
echo ""
echo "Note: For Resend test mode, you need to:"
echo "1. Have EMAIL_ENABLED=true in .env"
echo "2. Have valid RESEND_API_KEY in .env"
echo "3. Have verified your email domain in Resend (or use test mode with your verified email)"
echo "4. Set SEND_PIPELINE_SUCCESS_EMAIL=true and SEND_PIPELINE_FAILURE_EMAIL=true in .env"
