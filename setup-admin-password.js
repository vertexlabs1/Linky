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

async function setupAdminPassword() {
  console.log('🔧 Setting up admin password...');
  
  try {
    // Check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listing auth users:', authError);
      return;
    }
    
    const existingAuthUser = authUsers.users.find(u => u.email === 'tyler@vxlabs.co');
    
    if (existingAuthUser) {
      console.log('✅ Auth user already exists:', existingAuthUser.id);
      
      // Update the password
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        { password: 'LinkyAdmin2024!' }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
        return;
      }
      
      console.log('✅ Password updated successfully');
    } else {
      console.log('📝 Creating new auth user...');
      
      // Create new auth user
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: 'tyler@vxlabs.co',
        password: 'LinkyAdmin2024!',
        email_confirm: true,
        user_metadata: {
          first_name: 'Tyler',
          last_name: 'Amos'
        }
      });
      
      if (createError) {
        console.error('❌ Error creating auth user:', createError);
        return;
      }
      
      console.log('✅ Auth user created:', createData.user.id);
    }
    
    // Update the users table to link to auth user
    const { data: authUser } = await supabase.auth.admin.listUsers();
    const tylerAuthUser = authUser.users.find(u => u.email === 'tyler@vxlabs.co');
    
    if (tylerAuthUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          auth_user_id: tylerAuthUser.id,
          password_set: true 
        })
        .eq('email', 'tyler@vxlabs.co');
      
      if (updateError) {
        console.error('❌ Error updating users table:', updateError);
        return;
      }
      
      console.log('✅ Users table updated with auth_user_id');
    }
    
    // Verify the setup
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tyler@vxlabs.co')
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }
    
    console.log('✅ Setup complete!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password: LinkyAdmin2024!');
    console.log('🆔 Auth User ID:', user.auth_user_id);
    console.log('🔐 Password Set:', user.password_set);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupAdminPassword(); 