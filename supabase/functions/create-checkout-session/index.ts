import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe'
import { Resend } from 'npm:resend'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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
    const { priceId, customerEmail, successUrl, cancelUrl, metadata, phone } = await req.json()

    console.log('Creating checkout session with params:', { priceId, customerEmail, successUrl, cancelUrl, metadata, phone })

    // Validate required parameters
    if (!priceId) {
      throw new Error('priceId is required')
    }
    if (!customerEmail) {
      throw new Error('customerEmail is required')
    }
    if (!successUrl) {
      throw new Error('successUrl is required')
    }
    if (!cancelUrl) {
      throw new Error('cancelUrl is required')
    }

    // Create checkout session options
    const sessionOptions: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      metadata,
    };

    // Handle phone number - create customer if phone is provided
    if (phone && phone.trim()) {
      try {
        const customerId = await createOrGetCustomer(customerEmail, phone, metadata);
        sessionOptions.customer = customerId;
        console.log('Created/found customer with ID:', customerId);
      } catch (customerError) {
        console.error('Error creating/finding customer:', customerError);
        // Continue without customer creation if it fails
        sessionOptions.customer_email = customerEmail;
      }
    } else {
      // Only add customer_email if no customer was created
      sessionOptions.customer_email = customerEmail;
    }

    console.log('Creating Stripe session with options:', JSON.stringify(sessionOptions, null, 2));

    // Create a checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions)

    console.log('Successfully created session:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error);
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

// Helper to create or get a customer with phone/email
async function createOrGetCustomer(email: string, phone: string, metadata: any) {
  try {
    // Try to find existing customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      console.log('Found existing customer:', customers.data[0].id);
      return customers.data[0].id;
    }
    
    // Create new customer with name
    const customerName = metadata?.firstName && metadata?.lastName 
      ? `${metadata.firstName} ${metadata.lastName}`
      : undefined;
      
    const customer = await stripe.customers.create({
      email,
      name: customerName,
      phone,
      metadata,
    });
    console.log('Created new customer:', customer.id);
    return customer.id;
  } catch (error) {
    console.error('Error in createOrGetCustomer:', error);
    throw error;
  }
} 