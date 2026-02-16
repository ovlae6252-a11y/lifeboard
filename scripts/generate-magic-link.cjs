const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 읽기
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const testEmail = 'test-social@lifeboard.dev';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail,
    });

    if (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }

    console.log(data.properties.action_link);
  } catch (err) {
    console.error('Exception:', err.message);
    process.exit(1);
  }
})();
