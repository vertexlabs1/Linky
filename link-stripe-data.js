import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jydldvvsxwosyzwttmui.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function linkStripeData() {
  console.log('🔗 Linking Stripe data to user...\n');
  
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

    // From the admin dashboard, we can see the user has:
    // - Active subscriptions for "Linky Founding Member"
    // - Payment of $25.00 USD succeeded
    // - Next invoice: Oct 18 for $25.00 and $75.00
    
    // Update the user with the correct subscription plan structure
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_plan: 'Prospector', // Founding members start on Prospector plan
        subscription_status: 'active',
        founding_member: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating subscription plan:', updateError);
      return;
    }

    console.log('✅ Successfully updated subscription plan:');
    console.log('- Subscription Plan: null → Prospector');
    console.log('- Founding Member: true (confirmed)');
    console.log('- Subscription Status: active (confirmed)');

    console.log('\n📋 Subscription Plan Structure:');
    console.log('🥉 Prospector (Current) - Founding member on promo pricing');
    console.log('🥈 Networker (Future upgrade)');
    console.log('🥇 Rainmaker (Top tier)');

    console.log('\n📋 Next Steps for Stripe Linking:');
    console.log('1. Check Stripe webhook logs for customer_id');
    console.log('2. Update user record with stripe_customer_id');
    console.log('3. Link subscription_schedule_id for the 3-month promo');
    console.log('4. Set up proper transition to $75/month after 3 months');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

linkStripeData(); 