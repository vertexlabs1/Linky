const { createClient } = require('@supabase/supabase-js');

// Initialize client
const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTgwNTAsImV4cCI6MjA2ODI3NDA1MH0.kt8G6d6ZlqxgpU4HFg_vDDBg-0FlozNF4XUq9bf22uw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTylerData() {
  console.log('🔍 Checking Tyler\'s data in database...');
  
  const userEmail = 'tyleramos2025@gmail.com';
  
  try {
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('✅ User ID:', user.id);

    // Get all transactions for this user
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('❌ Error fetching transactions:', transactionsError);
    } else {
      console.log(`📊 Found ${transactions?.length || 0} transactions:`);
      if (transactions && transactions.length > 0) {
        transactions.forEach((t, index) => {
          console.log(`  ${index + 1}. ${t.description}`);
          console.log(`     Amount: $${t.amount/100} (${t.amount} cents)`);
          console.log(`     Status: ${t.status}`);
          console.log(`     Date: ${t.created_at}`);
          console.log(`     Receipt: ${t.receipt_url ? 'Yes' : 'No'}`);
          console.log(`     Stripe IDs: PI=${t.stripe_payment_intent_id}, CH=${t.stripe_charge_id}, INV=${t.stripe_invoice_id}`);
          console.log('');
        });
      }
    }

    // Get payment methods
    const { data: paymentMethods, error: pmError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (pmError) {
      console.error('❌ Error fetching payment methods:', pmError);
    } else {
      console.log(`💳 Found ${paymentMethods?.length || 0} payment methods:`);
      if (paymentMethods && paymentMethods.length > 0) {
        paymentMethods.forEach((pm, index) => {
          console.log(`  ${index + 1}. ${pm.card_brand} **** ${pm.card_last4}`);
          console.log(`     Expires: ${pm.card_exp_month}/${pm.card_exp_year}`);
          console.log(`     Default: ${pm.is_default}`);
          console.log('');
        });
      }
    }

    // Check if there are any other tables that might have payment data
    console.log('🔍 Checking for other payment-related data...');
    
    // Check if there's a subscriptions table
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (!subError && subscriptions && subscriptions.length > 0) {
      console.log(`📋 Found ${subscriptions.length} subscriptions:`);
      subscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. ${sub.plan_name} - $${sub.amount/100}`);
      });
    }

    // Check if there's an invoices table
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id);

    if (!invError && invoices && invoices.length > 0) {
      console.log(`🧾 Found ${invoices.length} invoices:`);
      invoices.forEach((inv, index) => {
        console.log(`  ${index + 1}. ${inv.description} - $${inv.amount/100}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTylerData(); 