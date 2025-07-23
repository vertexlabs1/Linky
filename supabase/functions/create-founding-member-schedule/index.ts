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

// Get price IDs from environment variables or use defaults
const FOUNDING_MEMBER_PRICE_ID = Deno.env.get('FOUNDING_MEMBER_PRICE_ID') || 'price_1RmIXSK06fIw6v4hj3rTDsRj'
const PROSPECTOR_PRICE_ID = Deno.env.get('PROSPECTOR_PRICE_ID') || 'price_1RmIR6K06fIw6v4hEoGab0Ts'

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
    const { customerEmail, successUrl, cancelUrl, metadata, phone } = await req.json()

    console.log('Creating founding member subscription schedule:', { customerEmail, metadata })
    console.log('Using price IDs:', { FOUNDING_MEMBER_PRICE_ID, PROSPECTOR_PRICE_ID })
    console.log('Stripe secret key exists:', !!stripeSecretKey)

    // Validate required parameters
    if (!customerEmail) {
      throw new Error('customerEmail is required')
    }
    if (!successUrl) {
      throw new Error('successUrl is required')
    }
    if (!cancelUrl) {
      throw new Error('cancelUrl is required')
    }

    // Step 1: Create or get customer
    let customer;
    try {
      console.log('🔍 Checking for existing Stripe customer...')
      // Check if customer exists
      const existingCustomers = await stripe.customers.list({ 
        email: customerEmail, 
        limit: 1 
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('✅ Found existing customer:', customer.id);
      } else {
        console.log('🆕 Creating new Stripe customer...')
        // Create new customer with name
        const customerName = metadata?.firstName && metadata?.lastName 
          ? `${metadata.firstName} ${metadata.lastName}`
          : undefined;
          
        const customerData = {
          email: customerEmail,
          name: customerName,
          phone: phone || undefined,
          metadata: metadata || {},
        };
        
        console.log('Customer data:', customerData)
        
        customer = await stripe.customers.create(customerData);
        console.log('✅ Created new customer:', customer.id);
      }
    } catch (customerError) {
      console.error('❌ Customer creation error:', customerError);
      console.error('Error details:', {
        message: customerError.message,
        type: customerError.type,
        code: customerError.code,
        statusCode: customerError.statusCode
      });
      throw new Error(`Failed to create customer: ${customerError.message}`);
    }

    // Step 2: Create or update user in database
    console.log('💾 Creating/updating user in database...');
    let userId;
    
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, stripe_customer_id')
        .eq('email', customerEmail)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing user:', checkError);
        throw new Error('Failed to check existing user');
      }

      if (existingUser) {
        console.log('✅ Found existing user:', existingUser.id);
        
        // Update existing user with Stripe data
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            stripe_customer_id: customer.id,
            first_name: metadata?.firstName || existingUser.first_name,
            last_name: metadata?.lastName || existingUser.last_name,
            phone: phone || existingUser.phone,
            status: 'pending', // Will be updated to 'active' when payment completes
            subscription_status: 'inactive',
            subscription_plan: 'Prospector',
            subscription_type: 'founding_member_schedule',
            founding_member: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select('id')
          .single();

        if (updateError) {
          console.error('❌ Error updating user:', updateError);
          throw new Error('Failed to update user');
        }
        
        userId = updatedUser.id;
        console.log('✅ Updated existing user:', userId);
      } else {
        console.log('🆕 Creating new user in database...')
        // Create new user
        const userData = {
          email: customerEmail,
          first_name: metadata?.firstName || '',
          last_name: metadata?.lastName || '',
          phone: phone || '',
          stripe_customer_id: customer.id,
          status: 'pending',
          subscription_status: 'inactive',
          subscription_plan: 'Prospector',
          subscription_type: 'founding_member_schedule',
          founding_member: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('User data:', userData)
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert(userData)
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Error creating user:', createError);
          throw new Error('Failed to create user');
        }
        
        userId = newUser.id;
        console.log('✅ Created new user:', userId);
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error(`Failed to create/update user in database: ${dbError.message}`);
    }

    // Step 3: Create subscription schedule with two phases
    console.log('📅 Creating subscription schedule...')
    try {
      const schedule = await stripe.subscriptionSchedules.create({
        customer: customer.id,
        start_date: 'now',
        end_behavior: 'release', // After phases, leave them on a standalone subscription
        phases: [
          {
            // Phase 1: Founding member period - $25 for 3 months (1 iteration)
            items: [
              { 
                price: FOUNDING_MEMBER_PRICE_ID, // Use environment variable
                quantity: 1 
              }
            ],
            iterations: 1, // Run exactly once (so $25 total for 3 months)
            billing_cycle_anchor: 'phase_start',
          },
          {
            // Phase 2: Regular Prospector pricing - $75/month indefinitely
            items: [
              { 
                price: PROSPECTOR_PRICE_ID, // Use environment variable
                quantity: 1 
              }
            ],
            // No iterations = infinite (continues forever)
          }
        ],
        metadata: {
          ...metadata,
          type: 'founding_member_schedule',
          user_id: userId // Include user ID for webhook processing
        }
      });

      console.log('✅ Created subscription schedule:', schedule.id);

      // Step 4: Create checkout session for the subscription schedule
      console.log('🛒 Creating checkout session...')
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customer.id,
        success_url: successUrl,
        cancel_url: cancelUrl,
        billing_address_collection: 'required',
        allow_promotion_codes: true, // This enables coupon support!
        subscription_data: {
          metadata: {
            ...metadata,
            subscription_schedule_id: schedule.id,
            type: 'founding_member',
            user_id: userId // Include user ID for webhook processing
          }
        },
        line_items: [
          {
            price: FOUNDING_MEMBER_PRICE_ID, // Use environment variable
            quantity: 1,
          },
        ],
        metadata: {
          ...metadata,
          subscription_schedule_id: schedule.id,
          customer_id: customer.id,
          user_id: userId, // Include user ID for webhook processing
          type: 'founding_member_schedule'
        }
      });

      console.log('✅ Created checkout session:', session.id);

      // Step 5: Update user with session and schedule IDs
      if (userId) {
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_session_id: session.id,
              stripe_subscription_schedule_id: schedule.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.error('⚠️ Error updating user with session data:', updateError);
          } else {
            console.log('✅ Updated user with session and schedule IDs');
          }
        } catch (updateError) {
          console.error('⚠️ Error updating user with session data:', updateError);
        }
      }

      return new Response(
        JSON.stringify({ 
          url: session.url,
          scheduleId: schedule.id,
          customerId: customer.id,
          sessionId: session.id,
          userId: userId
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    } catch (scheduleError) {
      console.error('❌ Error creating subscription schedule:', scheduleError);
      throw new Error(`Failed to create subscription schedule: ${scheduleError.message}`);
    }
  } catch (error) {
    console.error('❌ Error creating founding member schedule:', error);
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
    )
  }
}) 