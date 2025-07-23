const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdHZzd3dvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjI5NzI5MCwiZXhwIjoyMDQ3ODczMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserStatus() {
  try {
    console.log('🔍 Checking user status...\n');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .in('email', ['tyleramos2025@gmail.com', 'tyleramos2019@gmail.com'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log(`📊 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Password Set: ${user.password_set}`);
      console.log(`   Founding Member: ${user.founding_member}`);
      console.log(`   Subscription Plan: ${user.subscription_plan}`);
      console.log(`   Subscription Status: ${user.subscription_status}`);
      console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'None'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
      console.log('');
    });
    
    // Check if there are any auth users linked
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    const linkedAuthUsers = authUsers.users.filter(authUser => 
      users.some(user => user.email === authUser.email)
    );
    
    console.log(`🔐 Auth Users Linked: ${linkedAuthUsers.length}`);
    linkedAuthUsers.forEach(authUser => {
      console.log(`   - ${authUser.email} (ID: ${authUser.id})`);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserStatus(); 