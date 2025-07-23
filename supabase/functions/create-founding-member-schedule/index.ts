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
    // Add debugging for request body
    const requestText = await req.text();
    console.log('Raw request body:', requestText);
    
    let requestData;
    try {
      requestData = JSON.parse(requestText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }
    
    const { customerEmail, successUrl, cancelUrl, metadata, phone } = requestData;

    console.log('Creating founding member one-time payment:', { customerEmail, metadata })
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
            subscription_plan: 'Founding Member',
            subscription_type: 'founding_member_one_time',
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
          subscription_plan: 'Founding Member',
          subscription_type: 'founding_member_one_time',
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

    // Step 3: Create one-time payment checkout session
    console.log('🛒 Creating one-time payment checkout session...')
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment', // One-time payment, not subscription
        customer: customer.id,
        success_url: successUrl,
        cancel_url: cancelUrl,
        billing_address_collection: 'required',
        allow_promotion_codes: true,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Linky Founding Member - 3 Months Access',
                description: 'Special 3-month founding member access to Linky',
              },
              unit_amount: 5000, // $50.00 in cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          ...metadata,
          customer_id: customer.id,
          user_id: userId,
          type: 'founding_member_one_time',
          founding_member_start_date: new Date().toISOString(),
          founding_member_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        }
      });

      console.log('✅ Created one-time payment session:', session.id);

      // Step 4: Update user with founding member details
      if (userId) {
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_session_id: session.id,
              founding_member_payment_session_id: session.id,
              founding_member: true,
              founding_member_purchased_at: new Date().toISOString(),
              founding_member_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
              subscription_plan: 'Founding Member',
              subscription_status: 'active',
              subscription_type: 'founding_member_one_time',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.error('⚠️ Error updating user with founding member data:', updateError);
          } else {
            console.log('✅ Updated user with founding member details');
          }
        } catch (updateError) {
          console.error('⚠️ Error updating user with founding member data:', updateError);
        }
      }

      return new Response(
        JSON.stringify({ 
          url: session.url,
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
    } catch (sessionError) {
      console.error('❌ Error creating checkout session:', sessionError);
      throw new Error(`Failed to create checkout session: ${sessionError.message}`);
    }
  } catch (error) {
    console.error('❌ Error creating founding member payment:', error);
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