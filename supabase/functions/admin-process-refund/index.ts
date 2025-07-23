import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    })

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request data
    const { 
      userEmail, 
      amount, 
      reason, 
      adminNotes 
    } = await req.json()

    console.log('💰 Processing refund for:', userEmail, 'Amount:', amount)

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user.stripe_customer_id) {
      console.error('❌ User has no Stripe customer ID')
      return new Response(
        JSON.stringify({ error: 'User has no Stripe customer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get customer's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: 'card'
    })

    if (paymentMethods.data.length === 0) {
      console.error('❌ No payment methods found')
      return new Response(
        JSON.stringify({ error: 'No payment methods found for customer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get recent charges for this customer
    const charges = await stripe.charges.list({
      customer: user.stripe_customer_id,
      limit: 10
    })

    if (charges.data.length === 0) {
      console.error('❌ No charges found for customer')
      return new Response(
        JSON.stringify({ error: 'No charges found for customer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process refund on the most recent charge
    const latestCharge = charges.data[0]
    
    const refund = await stripe.refunds.create({
      charge: latestCharge.id,
      amount: amount * 100, // Convert to cents
      reason: reason || 'requested_by_customer',
      metadata: {
        admin_notes: adminNotes || '',
        user_email: userEmail,
        refunded_by: 'admin_dashboard'
      }
    })

    console.log('✅ Refund processed:', refund.id)

    // Log the refund action in database (you could create a refunds table)
    const { error: logError } = await supabase
      .from('users')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('email', userEmail)

    if (logError) {
      console.error('⚠️ Error logging refund:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Refund processed successfully',
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          reason: refund.reason,
          created: refund.created
        },
        user: {
          email: user.email,
          billing_name: user.billing_name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in admin-process-refund:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 