*** Variables ***
# Base URLs
${BASE_URL}                 http://localhost:3000
${FRONTEND_URL}             http://localhost:5173

# Test User Credentials
${ADMIN_EMAIL}              admin@example.com
${ADMIN_PASSWORD}           adminpass123
${TEST_USER_EMAIL}          test@example.com
${TEST_USER_PASSWORD}       testpass123

# API Endpoints
${LOGIN_ENDPOINT}           ${BASE_URL}/login
${LOGOUT_ENDPOINT}          ${BASE_URL}/logout
${ADMIN_USERS_ENDPOINT}     ${BASE_URL}/admin/users
${DASHBOARD_ENDPOINT}       ${BASE_URL}/dashboard/files
${HEALTH_ENDPOINT}          ${BASE_URL}/health

# Timeouts
${DEFAULT_TIMEOUT}          10s
${NETWORK_TIMEOUT}          30s

# Expected Response Messages
${ADMIN_MESSAGE}            sensitive data for admin only
${USER_MESSAGE}             this is your personal document list
${UNAUTHORIZED_MESSAGE}     Unauthorized
${FORBIDDEN_MESSAGE}        Lack of Permission
${TOKEN_EXPIRED_MESSAGE}    Token expired
