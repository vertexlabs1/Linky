import { createClient } from '@supabase/supabase-js'

// Configuration - using the correct URL from the project
const SUPABASE_URL = 'https://jydldvvsxwosyzwttmui.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.log('Please set it in your environment:')
  console.log('export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"')
  console.log('Get this from: Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function updateCurrentUser() {
  console.log('🔧 Updating current user (Tyler Amos) with proper Stripe data...')
  console.log('📡 Connecting to:', SUPABASE_URL)
  
  try {
    // First, let's check the current user data
    console.log('🔍 Checking current user data...')
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tyleramos2025@gmail.com')
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching current user:', fetchError)
      return
    }
    
    console.log('📊 Current user data:')
    console.log(JSON.stringify(currentUser, null, 2))
    
    // Update the user with proper Stripe data and promo tracking
    console.log('👤 Updating user record...')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: 'cus_ShlACaUBkEHvGI',
        stripe_subscription_id: 'sub_1RmLepK06flw6v4h58pajuqN',
        stripe_subscription_schedule_id: 'sub_sched_1RmLeEK06flw6v4hjaTSiqyw',
        subscription_type: 'founding_member_schedule',
        subscription_plan: 'Prospector',
        subscription_status: 'active',
        founding_member: true,
        promo_active: true,
        promo_type: 'founding_member',
        promo_expiration_date: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 3 months from now
        updated_at: new Date().toISOString()
      })
      .eq('email', 'tyleramos2025@gmail.com')
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return
    }
    
    console.log('✅ User record updated successfully!')
    console.log('📊 Updated user data:')
    console.log(JSON.stringify(updatedUser, null, 2))
    
    console.log('\n🎉 Manual user update completed successfully!')
    console.log('📋 Summary:')
    console.log('- Stripe Customer ID: cus_ShlACaUBkEHvGI')
    console.log('- Stripe Subscription ID: sub_1RmLepK06flw6v4h58pajuqN')
    console.log('- Stripe Subscription Schedule ID: sub_sched_1RmLeEK06flw6v4hjaTSiqyw')
    console.log('- Promo Type: founding_member')
    console.log('- Promo Active: true')
    console.log('- Promo Expiration: 3 months from now')
    console.log('- Subscription Plan: Prospector')
    console.log('- Subscription Type: founding_member_schedule')
    
    console.log('\n📋 Next steps:')
    console.log('1. Test the webhook by manually triggering the subscription schedule release')
    console.log('2. Verify the transition from $25/3months to $75/month works')
    console.log('3. Monitor webhook logs for subscription_schedule.released events')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateCurrentUser() 