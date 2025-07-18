import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jydldvvsxwosyzwttmui.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function findStripeCustomer() {
  console.log('🔍 Finding Stripe customer data...\n');
  
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

    console.log('\n📋 Steps to Link Stripe Data:');
    console.log('1. Go to your Stripe admin dashboard');
    console.log('2. Search for customer: tyleramos2025@gmail.com');
    console.log('3. Copy the Customer ID (starts with "cus_")');
    console.log('4. Copy the Subscription ID (starts with "sub_")');
    console.log('5. Copy the Subscription Schedule ID (starts with "sub_sched_")');
    console.log('6. Run the update script with these IDs');

    console.log('\n💡 From the admin dashboard, we can see:');
    console.log('- User has active subscriptions');
    console.log('- Payment of $25.00 USD succeeded');
    console.log('- Next invoice: Oct 18 for $25.00 and $75.00');
    console.log('- This indicates a subscription schedule is in place');

    console.log('\n🔧 Ready to update when you have the IDs!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

findStripeCustomer(); 