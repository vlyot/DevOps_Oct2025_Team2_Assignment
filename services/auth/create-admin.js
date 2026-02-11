/**
 * Create an admin user in Supabase for testing
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  console.log('Creating admin user...');

  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@test.com',
    password: 'admin123456',
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Admin user created:', data.user.email);
  console.log('Email: admin@test.com');
  console.log('Password: admin123456');
  console.log('Role: admin');
}

createAdmin();
