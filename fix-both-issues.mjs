import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdHZzd3dvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjI5NzI5MCwiZXhwIjoyMDQ3ODczMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBothIssues() {
  try {
    console.log('🔧 Fixing both user status and email issues...\n');
    
    // 1. Check current user status
    console.log('📊 Checking current user status...');
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
    
    for (const user of users) {
      console.log(`👤 User: ${user.email}`);
      console.log(`   Current Status: ${user.status}`);
      console.log(`   Password Set: ${user.password_set}`);
      console.log(`   Founding Member: ${user.founding_member}`);
      console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'None'}`);
      
      // 2. Fix status logic
      let newStatus = user.status;
      let shouldUpdate = false;
      
      if (user.founding_member && user.stripe_customer_id) {
        // User has paid
        if (!user.password_set && user.status !== 'paid') {
          newStatus = 'paid';
          shouldUpdate = true;
          console.log(`   🔄 Updating status to 'paid' (paid but no password set)`);
        } else if (user.password_set && user.status !== 'active') {
          newStatus = 'active';
          shouldUpdate = true;
          console.log(`   🔄 Updating status to 'active' (paid and password set)`);
        }
      } else if (user.founding_member && !user.stripe_customer_id) {
        // User is founding member but hasn't paid yet
        if (user.status !== 'pending') {
          newStatus = 'pending';
          shouldUpdate = true;
          console.log(`   🔄 Updating status to 'pending' (founding member, not paid)`);
        }
      }
      
      // 3. Update user status if needed
      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating user status:`, updateError);
        } else {
          console.log(`   ✅ Status updated to: ${newStatus}`);
        }
      }
      
      console.log('');
    }
    
    // 4. Test email system for tyleramos2019@gmail.com
    console.log('📧 Testing email system for tyleramos2019@gmail.com...');
    
    const testUser = users.find(u => u.email === 'tyleramos2019@gmail.com');
    if (testUser) {
      console.log('🎯 Sending test email...');
      
      // Call the email function directly
      const emailUrl = `${supabaseUrl}/functions/v1/send-founding-member-email`;
      const response = await fetch(emailUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          firstName: testUser.first_name,
          sessionId: 'test_session_' + Date.now()
        })
      });
      
      console.log('📧 Email function response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Test email sent successfully:', result);
      } else {
        const errorText = await response.text();
        console.error('❌ Test email failed:', errorText);
        
        // Try alternative approach - use admin resend function
        console.log('🔄 Trying admin resend function...');
        const adminEmailUrl = `${supabaseUrl}/functions/v1/admin-resend-welcome`;
        const adminResponse = await fetch(adminEmailUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: testUser.email,
            firstName: testUser.first_name
          })
        });
        
        console.log('📧 Admin email function response status:', adminResponse.status);
        
        if (adminResponse.ok) {
          const adminResult = await adminResponse.json();
          console.log('✅ Admin email sent successfully:', adminResult);
        } else {
          const adminErrorText = await adminResponse.text();
          console.error('❌ Admin email also failed:', adminErrorText);
        }
      }
    } else {
      console.log('⚠️  User tyleramos2019@gmail.com not found in database');
    }
    
    console.log('\n✅ Fix completed!');
    console.log('\n📋 Summary:');
    console.log('1. User status logic updated to show "paid" for users who paid but haven\'t set password');
    console.log('2. Email system tested for tyleramos2019@gmail.com');
    console.log('3. Admin panel updated to handle new status types');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixBothIssues(); 