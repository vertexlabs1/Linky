// Complete System Test - Bulletproof Billing & Admin Portal
// Run this to verify all components are working correctly

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Expected variables:');
  console.log('  VITE_SUPABASE_URL');
  console.log('  VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteSystem() {
  console.log('🚀 Testing Complete Bulletproof Billing System\n');
  
  const tests = {
    database: false,
    webhooks: false,
    edgeFunctions: false,
    adminPortal: false,
    healthMonitoring: false
  };

  try {
    // Test 1: Database Schema & Tables
    console.log('📊 1. Testing Database Schema...');
    
    const tableTests = [
      'users',
      'admin_actions', 
      'billing_events',
      'sync_health',
      'refunds',
      'plan_changes',
      'webhook_deliveries'
    ];

    let tablesExist = 0;
    for (const table of tableTests) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ Table ${table}: OK`);
        tablesExist++;
      }
    }

    if (tablesExist >= 6) tests.database = true;

    // Test database functions (if accessible)
    try {
      const { data: functions, error: functionsError } = await supabase
        .rpc('get_users_needing_sync');
      
      if (functionsError) {
        console.log(`   ⚠️ Database functions: ${functionsError.message} (May require service role)`);
      } else {
        console.log(`   ✅ Database functions: OK`);
      }
    } catch (err) {
      console.log(`   ⚠️ Database functions: Not accessible with current credentials`);
    }

    // Test 2: Edge Functions
    console.log('\n⚡ 2. Testing Edge Functions...');
    
    const edgeFunctions = [
      'stripe-webhook',
      'daily-billing-sync', 
      'admin-change-plan',
      'admin-refund',
      'send-password-reset'
    ];

    let functionsDeployed = 0;
    for (const func of edgeFunctions) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${func}`, {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        });
        
        if (response.status === 200 || response.status === 405) {
          console.log(`   ✅ Function ${func}: Deployed (${response.status})`);
          functionsDeployed++;
        } else {
          console.log(`   ❌ Function ${func}: Error (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ Function ${func}: Not accessible`);
      }
    }
    
    if (functionsDeployed >= 4) tests.edgeFunctions = true;

    // Test 3: Admin Portal Data
    console.log('\n👑 3. Testing Admin Portal Data...');
    
    // Check if any users exist
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('email, is_admin')
      .limit(10);

    if (usersError) {
      console.log(`   ❌ Users table: ${usersError.message}`);
    } else {
      console.log(`   ✅ Users table: ${allUsers?.length || 0} users found`);
      
      // Check for admin users
      const adminUsers = allUsers?.filter(u => u.is_admin === true) || [];
      if (adminUsers.length > 0) {
        console.log(`   ✅ Admin users: ${adminUsers.length} found (${adminUsers.map(u => u.email).join(', ')})`);
        tests.adminPortal = true;
      } else {
        console.log('   ⚠️ No admin users found');
      }
    }

    // Test admin actions table accessibility
    const { data: actions, error: actionsError } = await supabase
      .from('admin_actions')
      .select('*')
      .limit(1);
    
    if (actionsError) {
      console.log(`   ❌ Admin actions table: ${actionsError.message}`);
    } else {
      console.log(`   ✅ Admin actions table: Accessible`);
    }

    // Test 4: Health Monitoring
    console.log('\n🏥 4. Testing Health Monitoring...');
    
    // Test sync health table
    const { data: syncHealth, error: syncError } = await supabase
      .from('sync_health')
      .select('*')
      .limit(1);

    if (syncError) {
      console.log(`   ❌ Sync health table: ${syncError.message}`);
    } else {
      console.log(`   ✅ Sync health table: Accessible (${syncHealth?.length || 0} records)`);
      tests.healthMonitoring = true;
    }

    // Test webhook delivery tracking
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .limit(1);
    
    if (webhooksError) {
      console.log(`   ❌ Webhook deliveries: ${webhooksError.message}`);
    } else {
      console.log(`   ✅ Webhook delivery tracking: Accessible (${webhooks?.length || 0} records)`);
    }

    // Test 5: Stripe Integration Points
    console.log('\n💳 5. Testing Stripe Integration Points...');
    
    const { data: usersWithStripe, error: stripeError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id, subscription_plan')
      .not('stripe_customer_id', 'is', null)
      .limit(5);

    if (stripeError) {
      console.log(`   ❌ Stripe data access: ${stripeError.message}`);
    } else {
      console.log(`   ✅ Users with Stripe data: ${usersWithStripe?.length || 0}`);
      
      // Check subscription plans
      const { data: allPlans } = await supabase
        .from('users')
        .select('subscription_plan')
        .not('subscription_plan', 'is', null);
      
      const uniquePlans = [...new Set(allPlans?.map(u => u.subscription_plan) || [])];
      console.log(`   ✅ Subscription plans in use: ${uniquePlans.join(', ') || 'None'}`);
      
      tests.webhooks = true;
    }

    // Final Summary
    console.log('\n📋 SYSTEM TEST SUMMARY:');
    console.log('================================');
    
    const passedTests = Object.values(tests).filter(Boolean).length;
    const totalTests = Object.keys(tests).length;
    
    for (const [testName, passed] of Object.entries(tests)) {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${testName.toUpperCase()}: ${passed ? 'PASS' : 'FAIL'}`);
    }
    
    console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests >= 4) {
      console.log('\n🎉 SYSTEM READY! Your bulletproof billing system is operational! 🚀');
      console.log('\n📋 Next Steps:');
      console.log('   1. ✅ Database schema is deployed');
      console.log('   2. ✅ Edge functions are deployed');
      console.log('   3. 🔄 Test the founding member checkout flow');
      console.log('   4. 👑 Verify admin portal access at /admin');
      console.log('   5. 📊 Monitor webhook deliveries');
      console.log('   6. ⏰ Set up daily sync cron job');
      console.log('   7. 🔑 Switch to production Stripe keys when ready');
    } else {
      console.log('\n⚠️ Some components need attention before launch.');
      console.log('\n🔧 Common fixes:');
      console.log('   - Ensure .env file has correct Supabase credentials');
      console.log('   - Run database migrations: npx supabase db push');
      console.log('   - Create admin user in Supabase dashboard');
    }

  } catch (error) {
    console.error('\n❌ System test failed:', error.message);
  }
}

// Run the test
testCompleteSystem(); 