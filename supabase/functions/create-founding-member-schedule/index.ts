import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

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
      // Check if customer exists
      const existingCustomers = await stripe.customers.list({ 
        email: customerEmail, 
        limit: 1 
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('Found existing customer:', customer.id);
      } else {
        // Create new customer with name
        const customerName = metadata?.firstName && metadata?.lastName 
          ? `${metadata.firstName} ${metadata.lastName}`
          : undefined;
          
        customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          phone: phone || undefined,
          metadata: metadata || {},
        });
        console.log('Created new customer:', customer.id);
      }
    } catch (customerError) {
      console.error('Customer creation error:', customerError);
      throw new Error('Failed to create customer');
    }

    // Step 2: Create subscription schedule with two phases
    const schedule = await stripe.subscriptionSchedules.create({
      customer: customer.id,
      start_date: 'now',
      end_behavior: 'release', // After phases, leave them on a standalone subscription
      phases: [
        {
          // Phase 1: Founding member period - $25 for 3 months (1 iteration)
          items: [
            { 
              price: 'price_1RmIXSK06fIw6v4hj3rTDsRj', // $25 every 3 months (schedule price)
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
              price: 'price_1RmIR6K06fIw6v4hEoGab0Ts', // $75 monthly (Prospector)
              quantity: 1 
            }
          ],
          // No iterations = infinite (continues forever)
        }
      ],
      metadata: {
        ...metadata,
        type: 'founding_member_schedule'
      }
    });

    console.log('Created subscription schedule:', schedule.id);

    // Step 3: Create checkout session for the subscription schedule
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
          type: 'founding_member'
        }
      },
      line_items: [
        {
          price: 'price_1RmIXSK06fIw6v4hj3rTDsRj', // Start with founding member schedule price
          quantity: 1,
        },
      ],
      metadata: {
        ...metadata,
        subscription_schedule_id: schedule.id,
        customer_id: customer.id,
        type: 'founding_member_schedule'
      }
    });

    console.log('Created checkout session:', session.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        scheduleId: schedule.id,
        customerId: customer.id,
        sessionId: session.id 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error) {
    console.error('Error creating founding member schedule:', error);
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