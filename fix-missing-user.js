import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize clients
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey);

async function diagnoseMissingUser() {
  console.log('🔍 Diagnosing missing user issue...\n');

  try {
    // 1. Get recent Stripe customers
    console.log('📊 Checking recent Stripe customers...');
    const customers = await stripe.customers.list({
      limit: 10,
      created: { gte: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000) } // Last 24 hours
    });

    console.log(`Found ${customers.data.length} recent customers:`);
    customers.data.forEach(customer => {
      console.log(`- ${customer.email} (${customer.id}) - Created: ${new Date(customer.created * 1000).toISOString()}`);
    });

    // 2. Check for customers not in database
    console.log('\n🔍 Checking for customers missing from database...');
    for (const customer of customers.data) {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('stripe_customer_id', customer.id)
        .single();

      if (error || !dbUser) {
        console.log(`❌ Customer ${customer.email} (${customer.id}) NOT found in database`);
        
        // Check if user exists by email
        const { data: emailUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', customer.email)
          .single();

        if (emailUser) {
          console.log(`   ⚠️  User exists by email but not linked to Stripe customer`);
          console.log(`   📝 Database user ID: ${emailUser.id}`);
        } else {
          console.log(`   ❌ User doesn't exist in database at all`);
        }

        // Get customer's subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 5
        });

        if (subscriptions.data.length > 0) {
          console.log(`   💳 Has ${subscriptions.data.length} subscription(s):`);
          subscriptions.data.forEach(sub => {
            console.log(`      - ${sub.id} (${sub.status}) - ${sub.items.data[0]?.price.id}`);
          });
        }

        // Get customer's checkout sessions
        const sessions = await stripe.checkout.sessions.list({
          customer: customer.id,
          limit: 5
        });

        if (sessions.data.length > 0) {
          console.log(`   🛒 Has ${sessions.data.length} checkout session(s):`);
          sessions.data.forEach(session => {
            console.log(`      - ${session.id} (${session.status}) - Metadata:`, session.metadata);
          });
        }
      } else {
        console.log(`✅ Customer ${customer.email} (${customer.id}) found in database`);
      }
    }

    // 3. Check recent webhook events
    console.log('\n📡 Checking recent webhook events...');
    const events = await stripe.events.list({
      limit: 20,
      types: ['checkout.session.completed', 'customer.subscription.created', 'invoice.payment_succeeded']
    });

    console.log(`Found ${events.data.length} recent webhook events:`);
    events.data.forEach(event => {
      console.log(`- ${event.type} (${event.id}) - ${new Date(event.created * 1000).toISOString()}`);
    });

    // 4. Check database for orphaned users
    console.log('\n👥 Checking for users without Stripe data...');
    const { data: orphanedUsers, error: orphanedError } = await supabase
      .from('users')
      .select('*')
      .is('stripe_customer_id', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (orphanedError) {
      console.error('Error fetching orphaned users:', orphanedError);
    } else {
      console.log(`Found ${orphanedUsers.length} users without Stripe customer IDs:`);
      orphanedUsers.forEach(user => {
        console.log(`- ${user.email} (${user.id}) - Created: ${user.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

async function fixMissingUser(customerEmail) {
  console.log(`🔧 Attempting to fix missing user: ${customerEmail}\n`);

  try {
    // 1. Find customer in Stripe
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      console.log('❌ Customer not found in Stripe');
      return;
    }

    const customer = customers.data[0];
    console.log(`✅ Found Stripe customer: ${customer.id}`);

    // 2. Check if user exists in database
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', customerEmail)
      .single();

    if (userError || !existingUser) {
      console.log('❌ User not found in database, creating new user...');
      
      // Get customer's subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1
      });

      const subscription = subscriptions.data[0];
      
      // Get checkout session for metadata
      const sessions = await stripe.checkout.sessions.list({
        customer: customer.id,
        limit: 1
      });

      const session = sessions.data[0];
      
      // Create user record
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: customerEmail,
          first_name: session?.metadata?.firstName || customer.name?.split(' ')[0] || '',
          last_name: session?.metadata?.lastName || customer.name?.split(' ').slice(1).join(' ') || '',
          phone: customer.phone || null,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription?.id || null,
          stripe_session_id: session?.id || null,
          status: 'active',
          subscription_status: subscription?.status || 'inactive',
          subscription_plan: 'Prospector', // Default
          founding_member: session?.metadata?.type === 'founding_member_schedule',
          created_at: new Date(customer.created * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return;
      }

      console.log('✅ Successfully created user:', newUser.id);
      
      // Send welcome email
      await sendWelcomeEmail(customerEmail, newUser.first_name || 'there');
      
    } else {
      console.log('✅ User exists in database, updating Stripe data...');
      
      // Update user with Stripe data
      const { error: updateError } = await supabase
        .from('users')
        .update({
          stripe_customer_id: customer.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        return;
      }

      console.log('✅ Successfully updated user with Stripe customer ID');
      
      // Send welcome email if they haven't received one
      if (!existingUser.stripe_customer_id) {
        await sendWelcomeEmail(customerEmail, existingUser.first_name || 'there');
      }
    }

  } catch (error) {
    console.error('❌ Error fixing missing user:', error);
  }
}

async function sendWelcomeEmail(email, firstName) {
  console.log(`📧 Sending welcome email to ${email}...`);
  
  try {
    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email: email,
        firstName: firstName
      }
    });

    if (error) {
      console.error('❌ Error sending welcome email:', error);
    } else {
      console.log('✅ Welcome email sent successfully');
    }
  } catch (error) {
    console.error('❌ Error invoking welcome email function:', error);
  }
}

async function listAllUsers() {
  console.log('👥 Listing all users in database...\n');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.id})`);
      console.log(`  Stripe Customer: ${user.stripe_customer_id || 'None'}`);
      console.log(`  Subscription: ${user.stripe_subscription_id || 'None'}`);
      console.log(`  Status: ${user.subscription_status}`);
      console.log(`  Created: ${user.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error listing users:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'diagnose':
      await diagnoseMissingUser();
      break;
    case 'fix':
      const email = args[1];
      if (!email) {
        console.log('Usage: node fix-missing-user.js fix <email>');
        return;
      }
      await fixMissingUser(email);
      break;
    case 'list':
      await listAllUsers();
      break;
    default:
      console.log('Usage:');
      console.log('  node fix-missing-user.js diagnose    - Diagnose missing user issues');
      console.log('  node fix-missing-user.js fix <email> - Fix specific missing user');
      console.log('  node fix-missing-user.js list        - List all users');
  }
}

main().catch(console.error); 