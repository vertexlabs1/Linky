import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { email } = await req.json()

    console.log('🔧 Fixing missing user:', email)

    // Step 1: Find customer in Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Customer not found in Stripe' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customer = customers.data[0]
    console.log('✅ Found Stripe customer:', customer.id)

    // Step 2: Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1
    })

    const subscription = subscriptions.data[0]

    // Step 3: Get checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      customer: customer.id,
      limit: 1
    })

    const session = sessions.data[0]

    // Step 4: Check if user exists in database
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    let userId: string

    if (userError || !existingUser) {
      console.log('❌ User not found in database, creating new user...')
      
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email,
          first_name: customer.name?.split(' ')[0] || '',
          last_name: customer.name?.split(' ').slice(1).join(' ') || '',
          phone: customer.phone || null,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription?.id || null,
          stripe_session_id: session?.id || null,
          status: 'active',
          subscription_status: subscription?.status || 'active',
          subscription_plan: 'Prospector',
          subscription_type: session?.metadata?.type === 'founding_member_schedule' ? 'founding_member_schedule' : 'regular',
          founding_member: session?.metadata?.type === 'founding_member_schedule',
          created_at: new Date(customer.created * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createError) {
        console.error('❌ Error creating user:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: createError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      userId = newUser.id
      console.log('✅ Successfully created user:', userId)
      
    } else {
      console.log('✅ User exists in database, updating Stripe data...')
      
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription?.id || null,
          stripe_session_id: session?.id || null,
          status: 'active',
          subscription_status: subscription?.status || 'active',
          subscription_plan: 'Prospector',
          subscription_type: session?.metadata?.type === 'founding_member_schedule' ? 'founding_member_schedule' : 'regular',
          founding_member: session?.metadata?.type === 'founding_member_schedule',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('❌ Error updating user:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update user', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      userId = existingUser.id
      console.log('✅ Successfully updated user:', userId)
    }

    // Step 5: Send welcome email
    try {
      const firstName = customer.name?.split(' ')[0] || email.split('@')[0] || 'there'
      
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: email,
          firstName: firstName
        }
      })

      if (error) {
        console.error('❌ Error sending welcome email:', error)
      } else {
        console.log('✅ Welcome email sent successfully')
      }
    } catch (emailError) {
      console.error('❌ Error invoking welcome email function:', emailError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User fixed successfully',
        userId: userId,
        customerId: customer.id,
        subscriptionId: subscription?.id,
        sessionId: session?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error fixing missing user:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 