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
      newPlanId, 
      newPlanName,
      adminNotes 
    } = await req.json()

    console.log('🔄 Changing subscription for:', userEmail, 'to:', newPlanName)

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

    if (!user.stripe_customer_id || !user.stripe_subscription_id) {
      console.error('❌ User has no Stripe subscription')
      return new Response(
        JSON.stringify({ error: 'User has no active subscription' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current subscription
    const currentSubscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id)
    
    // Create new subscription with the new plan
    const newSubscription = await stripe.subscriptions.create({
      customer: user.stripe_customer_id,
      items: [{ price: newPlanId }],
      metadata: {
        admin_notes: adminNotes || '',
        changed_by: 'admin_dashboard',
        previous_plan: user.subscription_plan
      }
    })

    // Cancel the old subscription at period end
    await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true
    })

    console.log('✅ Subscription changed:', newSubscription.id)

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        stripe_subscription_id: newSubscription.id,
        subscription_plan: newPlanName,
        subscription_status: newSubscription.status,
        current_period_start: new Date(newSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(newSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: false,
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription changed successfully',
        subscription: {
          id: newSubscription.id,
          status: newSubscription.status,
          plan: newPlanName,
          current_period_end: new Date(newSubscription.current_period_end * 1000)
        },
        user: {
          email: updatedUser.email,
          subscription_plan: updatedUser.subscription_plan,
          subscription_status: updatedUser.subscription_status
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in admin-change-subscription:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 