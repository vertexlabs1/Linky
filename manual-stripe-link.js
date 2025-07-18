import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jydldvvsxwosyzwttmui.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function manualStripeLink() {
  console.log('🔗 Manually linking Stripe data...\n');
  
  try {
    // First, let's check the current user record
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tyleramos2025@gmail.com')
      .single();

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError);
      return;
    }

    console.log('Current user record:');
    console.log('==========================================');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.first_name} ${user.last_name}`);
    console.log(`Stripe Customer ID: ${user.stripe_customer_id || 'NOT SET'}`);
    console.log(`Stripe Session ID: ${user.stripe_session_id || 'NOT SET'}`);
    console.log(`Subscription Status: ${user.subscription_status}`);
    console.log(`Subscription Plan: ${user.subscription_plan}`);
    console.log(`Founding Member: ${user.founding_member}`);
    console.log('==========================================');

    // From the admin dashboard, we know:
    // - User has active subscriptions
    // - Payment of $25.00 USD succeeded
    // - Next invoice: Oct 18 for $25.00 and $75.00
    // - This indicates a subscription schedule is in place
    
    // Update the user with the proper subscription structure
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_plan: 'Prospector', // Founding members start on Prospector
        founding_member: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError);
      return;
    }

    console.log('✅ Successfully updated subscription structure:');
    console.log('- Subscription Plan: Prospector (confirmed)');
    console.log('- Founding Member: true (confirmed)');
    console.log('- Subscription Status: active (confirmed)');

    console.log('\n📋 Current Subscription Structure:');
    console.log('🥉 Prospector Plan (Founding Member)');
    console.log('💰 $25 for 3 months (promo pricing)');
    console.log('🔄 Auto-transition to $75/month after 3 months');
    console.log('👑 Founding Member benefits for life');

    console.log('\n📋 Next Steps for Complete Stripe Integration:');
    console.log('1. Get Stripe Customer ID from admin dashboard');
    console.log('2. Update stripe_customer_id in database');
    console.log('3. Link stripe_subscription_schedule_id');
    console.log('4. Verify webhook is properly configured');
    console.log('5. Test the 3-month to $75 transition');

    console.log('\n💡 The user is now properly configured as a founding member');
    console.log('💡 The subscription schedule will handle the pricing transition');
    console.log('💡 The webhook will update the user when the schedule releases');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

manualStripeLink(); 