import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

// Initialize Supabase client with service role for full access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    const { userId, amount, reason, adminId } = await req.json()

    console.log('💰 Processing refund request:', { userId, amount, reason, adminId })

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    if (!user.stripe_customer_id) {
      throw new Error('User has no Stripe customer ID')
    }

    // Get the latest payment intent for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: user.stripe_customer_id,
      limit: 1
    })

    if (!paymentIntents.data.length) {
      throw new Error('No payment found for this customer')
    }

    const latestPayment = paymentIntents.data[0]

    // Process refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: latestPayment.id,
      amount: Math.round(amount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        admin_id: adminId,
        reason: reason,
        user_id: userId
      }
    })

    // Log refund in database
    const { error: refundError } = await supabase
      .from('refunds')
      .insert({
        user_id: userId,
        admin_id: adminId,
        stripe_refund_id: refund.id,
        amount: amount,
        currency: refund.currency,
        reason: reason,
        status: refund.status,
        processed_at: new Date().toISOString()
      })

    if (refundError) {
      console.error('Failed to log refund in database:', refundError)
      // Continue - refund was processed in Stripe
    }

    // Log admin action
    const { error: actionError } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: userId,
        action_type: 'refund',
        old_value: { balance: 0 },
        new_value: { refund_amount: amount, refund_id: refund.id },
        reason: reason,
        stripe_object_id: refund.id
      })

    console.log('✅ Refund processed successfully:', refund.id)

    return new Response(JSON.stringify({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Refund failed:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 