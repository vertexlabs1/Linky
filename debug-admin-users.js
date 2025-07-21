// Debug Admin Users Page
// Run this to check what's happening with user fetching

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co';
const supabaseKey = 'your_supabase_anon_key_here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUsers() {
  console.log('🔍 Debugging Admin Users Page...\n');

  try {
    // 1. Check if we can fetch users at all
    console.log('1. Testing basic user fetch...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (allUsersError) {
      console.error('❌ Error fetching all users:', allUsersError);
      return;
    }

    console.log(`✅ Found ${allUsers?.length || 0} total users`);
    console.log('Users:', allUsers?.map(u => ({ email: u.email, name: `${u.first_name} ${u.last_name}`, status: u.status })));

    // 2. Check specifically for Tyler
    console.log('\n2. Looking for Tyler specifically...');
    const tyler = allUsers?.find(u => u.email === 'tyler@vxlabs.co');
    if (tyler) {
      console.log('✅ Found Tyler:', {
        id: tyler.id,
        email: tyler.email,
        name: `${tyler.first_name} ${tyler.last_name}`,
        status: tyler.status,
        is_admin: tyler.is_admin,
        auth_user_id: tyler.auth_user_id
      });
    } else {
      console.log('❌ Tyler not found in users table');
    }

    // 3. Test the exact query used in the admin page
    console.log('\n3. Testing admin page query...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select(`
        id,
        auth_user_id,
        email,
        first_name,
        last_name,
        phone,
        company,
        job_title,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_plan,
        subscription_status,
        founding_member,
        status,
        is_admin,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (adminError) {
      console.error('❌ Error with admin query:', adminError);
      return;
    }

    console.log(`✅ Admin query found ${adminUsers?.length || 0} users`);
    const tylerInAdmin = adminUsers?.find(u => u.email === 'tyler@vxlabs.co');
    if (tylerInAdmin) {
      console.log('✅ Tyler found in admin query:', {
        email: tylerInAdmin.email,
        name: `${tylerInAdmin.first_name} ${tylerInAdmin.last_name}`,
        status: tylerInAdmin.status
      });
    } else {
      console.log('❌ Tyler not found in admin query');
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (policiesError) {
      console.error('❌ RLS policy issue:', policiesError);
    } else {
      console.log('✅ RLS policies allow access');
    }

    // 5. Check if there are any filters being applied
    console.log('\n5. Testing with different filters...');
    
    // Test "All Users" filter
    const allFiltered = adminUsers?.filter(u => true);
    console.log(`All users filter: ${allFiltered?.length || 0} users`);
    
    // Test "Admins Only" filter
    const adminsOnly = adminUsers?.filter(u => u.is_admin);
    console.log(`Admins only filter: ${adminsOnly?.length || 0} users`);
    if (adminsOnly?.length > 0) {
      console.log('Admins found:', adminsOnly.map(u => u.email));
    }
    
    // Test "Founding Members" filter
    const foundingMembers = adminUsers?.filter(u => u.founding_member);
    console.log(`Founding members filter: ${foundingMembers?.length || 0} users`);
    if (foundingMembers?.length > 0) {
      console.log('Founding members found:', foundingMembers.map(u => u.email));
    }

    // 6. Check search functionality
    console.log('\n6. Testing search functionality...');
    const searchTerm = 'tyler';
    const searchResults = adminUsers?.filter(u => 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log(`Search for "${searchTerm}": ${searchResults?.length || 0} results`);
    if (searchResults?.length > 0) {
      console.log('Search results:', searchResults.map(u => u.email));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugUsers(); 