import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAdmin() {
  console.log('🔍 Verifying admin user setup...');
  
  try {
    // Check if Tyler exists
    console.log('\n👤 Checking Tyler Amos user...');
    const { data: tyler, error: tylerError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tyler@vxlabs.co')
      .single();
    
    if (tylerError) {
      console.log('❌ Error finding Tyler:', tylerError.message);
    } else if (!tyler) {
      console.log('❌ Tyler Amos not found in users table');
    } else {
      console.log('✅ Tyler Amos found:');
      console.log(`   Email: ${tyler.email}`);
      console.log(`   Name: ${tyler.first_name} ${tyler.last_name}`);
      console.log(`   Phone: ${tyler.phone}`);
      console.log(`   Status: ${tyler.status}`);
    }
    
    // Check admin role
    console.log('\n👑 Checking admin role...');
    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        user_roles.*,
        users(email, first_name, last_name),
        roles(name, description)
      `)
      .eq('users.email', 'tyler@vxlabs.co')
      .eq('roles.name', 'admin')
      .eq('user_roles.active', true)
      .single();
    
    if (roleError) {
      console.log('❌ Error checking admin role:', roleError.message);
    } else if (!adminRole) {
      console.log('❌ Admin role not found for Tyler');
    } else {
      console.log('✅ Admin role confirmed:');
      console.log(`   Role: ${adminRole.roles.name}`);
      console.log(`   Active: ${adminRole.active}`);
      console.log(`   Granted at: ${adminRole.granted_at}`);
    }
    
    // Test admin function
    console.log('\n🧪 Testing admin functions...');
    const { data: hasRole, error: functionError } = await supabase
      .rpc('user_has_role', {
        user_uuid: tyler?.id,
        role_name: 'admin'
      });
    
    if (functionError) {
      console.log('❌ Error testing user_has_role function:', functionError.message);
    } else {
      console.log(`✅ user_has_role test: ${hasRole ? 'PASS' : 'FAIL'}`);
    }
    
    // Show all users
    console.log('\n📊 All users in database:');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        user_roles(
          active,
          roles(name)
        )
      `);
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      allUsers.forEach(user => {
        const roles = user.user_roles
          ?.filter(ur => ur.active)
          ?.map(ur => ur.roles.name)
          ?.join(', ') || 'No roles';
        console.log(`   ${user.email} (${user.first_name} ${user.last_name}) - Roles: ${roles}`);
      });
    }
    
    console.log('\n🎉 Verification complete!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

verifyAdmin(); 