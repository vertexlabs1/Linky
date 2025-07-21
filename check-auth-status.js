import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthStatus() {
  console.log('🔍 Checking auth user status...');
  
  try {
    // Check if auth user exists
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listing auth users:', authError);
      return;
    }
    
    const tylerAuthUser = authUsers.users.find(u => u.email === 'tyler@vxlabs.co');
    
    console.log('📧 Auth User Status:');
    if (tylerAuthUser) {
      console.log('✅ Auth user exists:', tylerAuthUser.id);
      console.log('   Email:', tylerAuthUser.email);
      console.log('   Role:', tylerAuthUser.role);
      console.log('   Email confirmed:', !!tylerAuthUser.email_confirmed_at);
    } else {
      console.log('❌ Auth user does not exist');
    }
    
    // Check database user
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tyler@vxlabs.co')
      .single();
    
    console.log('\n🗄️ Database User Status:');
    if (dbError) {
      console.log('❌ Error fetching database user:', dbError.message);
    } else if (dbUser) {
      console.log('✅ Database user exists:', dbUser.id);
      console.log('   Email:', dbUser.email);
      console.log('   Auth User ID:', dbUser.auth_user_id);
      console.log('   Password Set:', dbUser.password_set);
      console.log('   Status:', dbUser.status);
    } else {
      console.log('❌ Database user does not exist');
    }
    
    // Check role assignment
    if (dbUser) {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          active,
          granted_at,
          roles(name)
        `)
        .eq('user_id', dbUser.id);
      
      console.log('\n👑 Role Assignment Status:');
      if (rolesError) {
        console.log('❌ Error checking roles:', rolesError.message);
      } else {
        const adminRole = userRoles.find(ur => ur.roles?.name === 'admin');
        if (adminRole) {
          console.log('✅ Admin role assigned');
          console.log('   Active:', adminRole.active);
          console.log('   Granted at:', adminRole.granted_at);
        } else {
          console.log('❌ Admin role not assigned');
        }
      }
    }
    
    // Test login
    console.log('\n🔐 Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'tyler@vxlabs.co',
      password: 'LinkyAdmin2024!'
    });
    
    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log('   User ID:', loginData.user.id);
      console.log('   Email:', loginData.user.email);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAuthStatus(); 