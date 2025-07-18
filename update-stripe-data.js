import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jydldvvsxwosyzwttmui.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Actual Stripe IDs from the admin dashboard
const STRIPE_CUSTOMER_ID = 'cus_ShlACaUBkEHvGI';
const STRIPE_SUBSCRIPTION_ID = 'sub_1RmLepK06flw6v4h58pajuqN';
const STRIPE_SUBSCRIPTION_SCHEDULE_ID = 'sub_sched_1RmLeEK06flw6v4hjaTSiqyw';

async function updateStripeData() {
  console.log('🔗 Updating Stripe data with actual IDs...\n');
  
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
    console.log(`Stripe Customer ID: ${user.stripe_customer_id || 'NULL'}`);
    console.log(`Stripe Subscription ID: ${user.stripe_subscription_id || 'NULL'}`);
    console.log(`Stripe Session ID: ${user.stripe_session_id || 'NULL'}`);
    console.log(`Subscription Status: ${user.subscription_status}`);
    console.log(`Subscription Plan: ${user.subscription_plan}`);
    console.log(`Founding Member: ${user.founding_member}`);
    console.log('==========================================');

    console.log('\n📋 Updating with Stripe IDs from admin dashboard:');
    console.log(`Customer ID: ${STRIPE_CUSTOMER_ID}`);
    console.log(`Subscription ID: ${STRIPE_SUBSCRIPTION_ID}`);
    console.log(`Schedule ID: ${STRIPE_SUBSCRIPTION_SCHEDULE_ID} (will add column later)`);

    // Update the user with Stripe data (without schedule ID for now)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: STRIPE_CUSTOMER_ID,
        stripe_subscription_id: STRIPE_SUBSCRIPTION_ID,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating Stripe data:', updateError);
      return;
    }

    console.log('\n✅ Successfully updated Stripe data!');
    console.log('- Stripe Customer ID linked');
    console.log('- Stripe Subscription ID linked');
    console.log('- Schedule ID will be added when column is available');

    console.log('\n📋 Subscription Details:');
    console.log('- Product: Linky Founding Member');
    console.log('- Current Price: $25.00 every 3 months');
    console.log('- Next Invoice: Oct 18 for $75.00');
    console.log('- Status: Active');
    console.log('- Payment Method: VISA ending in 9287');

    console.log('\n📋 Next Steps:');
    console.log('1. Add stripe_subscription_schedule_id column');
    console.log('2. Update with schedule ID');
    console.log('3. Verify webhook is properly configured');
    console.log('4. Test subscription schedule transitions');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateStripeData(); 