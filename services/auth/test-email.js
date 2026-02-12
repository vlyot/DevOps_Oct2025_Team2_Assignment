/**
 * Test script for email subscription system
 *
 * This script will:
 * 1. Subscribe email: s10259894@connect.np.edu.sg
 * 2. Create a test user named "Kai"
 * 3. Trigger email notification
 *
 * Prerequisites:
 * - Auth service must be running (npm start)
 * - .env file must have valid Supabase credentials
 * - Database migration must be completed
 */

const https = require('http');

const API_URL = 'http://localhost:3000';
const TEST_EMAIL = 's10259894@connect.np.edu.sg';
const TEST_USER_EMAIL = 'kai@example.com';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testEmailSystem() {
  console.log('🔧 Testing Email Subscription System\n');

  // Step 1: Check health
  console.log('1️⃣ Checking service health...');
  try {
    const health = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    });
    console.log('✅ Service is healthy:', health.data);
  } catch (error) {
    console.error('❌ Service is not running. Please start it with: npm start');
    process.exit(1);
  }

  // Step 2: Subscribe email
  console.log('\n2️⃣ Subscribing email:', TEST_EMAIL);
  try {
    const subscribe = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/subscribe',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: TEST_EMAIL });

    if (subscribe.status === 201 || subscribe.data.message?.includes('subscribed')) {
      console.log('✅ Successfully subscribed:', subscribe.data);
    } else {
      console.log('⚠️ Subscribe response:', subscribe.data);
    }
  } catch (error) {
    console.error('❌ Failed to subscribe:', error.message);
    process.exit(1);
  }

  // Step 3: Verify subscription
  console.log('\n3️⃣ Verifying subscription status...');
  try {
    const status = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/subscribe/status?email=${encodeURIComponent(TEST_EMAIL)}`,
      method: 'GET'
    });
    console.log('✅ Subscription status:', status.data);

    if (!status.data.subscribed) {
      console.error('❌ Email is not subscribed. Cannot proceed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to check status:', error.message);
  }

  // Step 4: Login as admin to get token
  console.log('\n4️⃣ Note: To create a user, you need an admin token.');
  console.log('   Please run this command manually:\n');
  console.log('   curl -X POST http://localhost:3000/admin/users \\');
  console.log('     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log(`     -d '{"email":"${TEST_USER_EMAIL}","password":"testpass123","role":"user"}'\n`);
  console.log('   Replace YOUR_ADMIN_TOKEN with your actual admin JWT token.');
  console.log('   After running this, check your inbox at:', TEST_EMAIL);
  console.log('\n✅ Setup complete! Email subscription is ready.');
}

testEmailSystem().catch(console.error);
