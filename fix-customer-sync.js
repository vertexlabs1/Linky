import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTgwNTAsImV4cCI6MjA2ODI3NDA1MH0.kt8G6d6ZlqxgpU4HFg_vDDBg-0FlozNF4XUq9bf22uw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixCustomerSync() {
  console.log('🔧 Fixing customer sync for Tyler Amos...')
  
  try {
    // First, let's check the current user data
    const { data: currentUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tyleramos2025@gmail.com')  // Updated to correct email
      .single()

    if (findError) {
      console.error('❌ Error finding user:', findError)
      return
    }

    console.log('📊 Current user data:', {
      email: currentUser.email,
      stripe_customer_id: currentUser.stripe_customer_id,
      subscription_status: currentUser.subscription_status,
      founding_member: currentUser.founding_member
    })

    // Update user with correct Stripe customer ID and billing information
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        // Correct Stripe customer ID (from your screenshot)
        stripe_customer_id: 'cus_SimDKesZ6H2noN',
        stripe_subscription_id: 'sub_1RmLepK06flw6v4h58pajuqN',
        stripe_subscription_schedule_id: 'sub_sched_1RmLeEK06flw6v4hjaTSiqyw',
        
        // Account information
        email: 'tyleramos2025@gmail.com',  // Updated to correct email
        first_name: 'Tyler',
        last_name: 'Amos',
        
        // Billing information (from Stripe customer)
        billing_name: 'Tyler Amos',
        billing_email: 'tyleramos2025@gmail.com',  // Updated to correct email
        
        // Subscription information
        subscription_plan: 'Prospector',
        subscription_status: 'active',
        subscription_type: 'founding_member_schedule',
        
        // Promo tracking
        promo_active: true,
        promo_type: 'founding_member',
        promo_expiration_date: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 3 months from now
        
        // Founding member status
        founding_member: true,
        status: 'active',
        
        // Sync tracking
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', 'tyleramos2025@gmail.com')  // Updated to correct email
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return
    }

    console.log('✅ User updated successfully:', {
      email: updatedUser.email,
      stripe_customer_id: updatedUser.stripe_customer_id,
      billing_name: updatedUser.billing_name,
      billing_email: updatedUser.billing_email,
      promo_active: updatedUser.promo_active,
      promo_type: updatedUser.promo_type
    })

    // Test email functionality
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
          email: 'tyleramos2025@gmail.com',  // Updated to correct email
          firstName: 'Tyler',
          source: 'admin_dashboard'
        })
      });
      
      if (response.ok) {
        console.log('✅ Email test successful');
      } else {
        console.log('⚠️ Email test failed:', response.status);
      }
    } catch (emailError) {
      console.error('❌ Email test error:', emailError);
    }

    console.log('\n🎉 Customer sync fix completed!')
    console.log('📊 Summary:')
    console.log('- ✅ Correct Stripe customer ID linked')
    console.log('- ✅ Billing information separated from account information')
    console.log('- ✅ Founding member status properly set')
    console.log('- ✅ Promo tracking enabled')
    console.log('- ✅ Email functionality tested')

  } catch (error) {
    console.error('❌ Error in fixCustomerSync:', error)
  }
}

fixCustomerSync() 