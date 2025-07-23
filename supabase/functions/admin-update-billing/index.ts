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
      billingName, 
      billingEmail, 
      billingPhone, 
      billingAddress 
    } = await req.json()

    console.log('🔧 Admin updating billing for:', userEmail)

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

    // Update customer in Stripe
    const customerUpdate: any = {}
    if (billingName) customerUpdate.name = billingName
    if (billingEmail) customerUpdate.email = billingEmail
    if (billingPhone) customerUpdate.phone = billingPhone
    if (billingAddress) customerUpdate.address = billingAddress

    const updatedCustomer = await stripe.customers.update(
      user.stripe_customer_id,
      customerUpdate
    )

    console.log('✅ Stripe customer updated:', updatedCustomer.id)

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        billing_name: billingName || user.billing_name,
        billing_email: billingEmail || user.billing_email,
        billing_phone: billingPhone || user.billing_phone,
        billing_address: billingAddress ? JSON.stringify(billingAddress) : user.billing_address,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', userEmail)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User billing updated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Billing information updated successfully',
        user: {
          email: updatedUser.email,
          billing_name: updatedUser.billing_name,
          billing_email: updatedUser.billing_email,
          billing_phone: updatedUser.billing_phone,
          last_sync_at: updatedUser.last_sync_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in admin-update-billing:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 