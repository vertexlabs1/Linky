import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTgwNTAsImV4cCI6MjA2ODI3NDA1MH0.kt8G6d6ZlqxgpU4HFg_vDDBg-0FlozNF4XUq9bf22uw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUserBasic() {
  console.log('🔧 Fixing basic user Stripe data...')
  
  try {
    // Step 1: Check current user data
    console.log('📊 Checking current user data...')
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tyleramos2019@gmail.com')
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching current user:', fetchError)
      return
    }
    
    console.log('📊 Current user data:')
    console.log(JSON.stringify(currentUser, null, 2))
    
    // Step 2: Update user with basic Stripe data (without promo columns)
    console.log('👤 Updating user record with basic Stripe data...')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: 'cus_ShlACaUBkEHvGI',
        stripe_subscription_id: 'sub_1RmLepK06flw6v4h58pajuqN',
        stripe_subscription_schedule_id: 'sub_sched_1RmLeEK06flw6v4hjaTSiqyw',
        subscription_plan: 'Prospector',
        subscription_status: 'active',
        status: 'active',
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', 'tyleramos2019@gmail.com')
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return
    }
    
    console.log('✅ User record updated successfully!')
    console.log('📊 Updated user data:')
    console.log(JSON.stringify(updatedUser, null, 2))
    
    // Step 3: Test email functionality
    console.log('📧 Testing email functionality...')
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ 
          email: 'tyleramos2019@gmail.com', 
          firstName: 'John',
          source: 'admin_dashboard'
        })
      });

      console.log('📧 Email test response status:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email test successful:', result);
      } else {
        const errorText = await response.text();
        console.log('❌ Email test failed:', errorText);
      }
    } catch (emailError) {
      console.error('❌ Email test error:', emailError);
    }
    
    console.log('\n🎉 Basic user data fix completed successfully!')
    console.log('📋 Summary:')
    console.log('- Stripe Customer ID: cus_ShlACaUBkEHvGI')
    console.log('- Stripe Subscription ID: sub_1RmLepK06flw6v4h58pajuqN')
    console.log('- Stripe Subscription Schedule ID: sub_sched_1RmLeEK06flw6v4hjaTSiqyw')
    console.log('- Subscription Plan: Prospector')
    console.log('- Status: active')
    
    console.log('\n📋 Next steps:')
    console.log('1. Test the admin panel user profile modal')
    console.log('2. Verify email functionality works')
    console.log('3. Check that subscription shows correctly')
    console.log('4. Test password reset functionality')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixUserBasic() 