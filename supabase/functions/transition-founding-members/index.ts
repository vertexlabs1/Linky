import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Better error handling for environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is not set')
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
})

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get Prospector price ID from environment
const PROSPECTOR_PRICE_ID = Deno.env.get('PROSPECTOR_PRICE_ID') || 'price_1Rlz4pGgWLKrksJxExadkxnL'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    })
  }

  try {
    console.log('🔄 Starting founding member transition process...')
    console.log('Using Prospector price ID:', PROSPECTOR_PRICE_ID)

    // Step 1: Find users whose founding member period has expired
    console.log('🔍 Finding expired founding members...')
    const { data: expiredUsers, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('subscription_type', 'founding_member_one_time')
      .lt('founding_member_expires_at', new Date().toISOString())
      .eq('subscription_status', 'active');

    if (queryError) {
      console.error('❌ Error querying expired users:', queryError);
      throw new Error(`Failed to query expired users: ${queryError.message}`);
    }

    console.log(`📊 Found ${expiredUsers?.length || 0} expired founding members`);

    if (!expiredUsers || expiredUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No expired founding members found',
          processed: 0
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Step 2: Process each expired user
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const user of expiredUsers) {
      try {
        console.log(`🔄 Processing user: ${user.email} (ID: ${user.id})`);

        // Check if user already has a Stripe subscription (prevent duplicates)
        if (user.stripe_subscription_id) {
          console.log(`⚠️ User ${user.email} already has subscription ${user.stripe_subscription_id}, skipping`);
          results.failed++;
          results.errors.push(`User ${user.email} already has subscription`);
          continue;
        }

        // Step 3: Create new Stripe subscription
        console.log(`💳 Creating Stripe subscription for user ${user.email}...`);
        const subscription = await stripe.subscriptions.create({
          customer: user.stripe_customer_id,
          items: [{ price: PROSPECTOR_PRICE_ID }],
          metadata: {
            user_id: user.id,
            email: user.email,
            transition_from: 'founding_member_one_time',
            transition_date: new Date().toISOString()
          }
        });

        console.log(`✅ Created subscription: ${subscription.id}`);

        // Step 4: Update user in database
        console.log(`💾 Updating user ${user.email} in database...`);
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_plan: 'Prospector',
            subscription_status: 'active',
            subscription_type: 'prospector_monthly',
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating user ${user.email}:`, updateError);
          results.failed++;
          results.errors.push(`Failed to update user ${user.email}: ${updateError.message}`);
          continue;
        }

        // Step 5: Log transition in audit table
        console.log(`📝 Logging transition for user ${user.email}...`);
        const { error: auditError } = await supabase
          .from('user_subscription_transitions')
          .insert({
            user_id: user.id,
            from_plan: 'Founding Member',
            to_plan: 'Prospector',
            stripe_customer_id: user.stripe_customer_id,
            stripe_subscription_id: subscription.id,
            success: true
          });

        if (auditError) {
          console.error(`⚠️ Error logging transition for user ${user.email}:`, auditError);
          // Don't fail the whole process for audit logging errors
        }

        console.log(`✅ Successfully transitioned user ${user.email} to Prospector`);
        results.success++;

      } catch (userError) {
        console.error(`❌ Error processing user ${user.email}:`, userError);
        results.failed++;
        results.errors.push(`Error processing user ${user.email}: ${userError.message}`);

        // Log failed transition
        try {
          await supabase
            .from('user_subscription_transitions')
            .insert({
              user_id: user.id,
              from_plan: 'Founding Member',
              to_plan: 'Prospector',
              stripe_customer_id: user.stripe_customer_id,
              success: false,
              error_message: userError.message
            });
        } catch (auditError) {
          console.error('⚠️ Error logging failed transition:', auditError);
        }
      }
    }

    console.log(`🎉 Transition process complete. Success: ${results.success}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({ 
        message: 'Founding member transition process completed',
        processed: expiredUsers.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in founding member transition process:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
}); 