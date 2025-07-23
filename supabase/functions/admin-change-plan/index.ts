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
    const { userId, newPlan, reason, adminId } = await req.json()

    console.log('🔄 Processing plan change request:', { userId, newPlan, reason, adminId })

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Get price ID for new plan
    const priceIdMap: Record<string, string> = {
      'prospector': 'price_1RmIR6K06fIw6v4hEoGab0Ts',
      'networker': 'price_1RmIR6K06fIw6v4hT68Bm0ST',
      'rainmaker': 'price_1RmIR7K06fIw6v4h5ovxqVqW'
    }

    const newPriceId = priceIdMap[newPlan.toLowerCase()]
    if (!newPriceId) {
      throw new Error('Invalid plan specified')
    }

    // Update subscription in Stripe
    const subscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      {
        items: [{ price: newPriceId, quantity: 1 }],
        proration_behavior: 'create_prorations'
      }
    )

    // Update user in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_plan: newPlan.charAt(0).toUpperCase() + newPlan.slice(1),
        subscription_status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        last_sync_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      throw new Error('Failed to update user in database')
    }

    // Log plan change
    const { error: planChangeError } = await supabase
      .from('plan_changes')
      .insert({
        user_id: userId,
        admin_id: adminId,
        old_plan: user.subscription_plan,
        new_plan: newPlan.charAt(0).toUpperCase() + newPlan.slice(1),
        old_price_id: user.stripe_subscription_id, // This would need the actual old price ID
        new_price_id: newPriceId,
        effective_date: new Date().toISOString(),
        reason: reason,
        stripe_subscription_id: subscription.id
      })

    // Log admin action
    const { error: actionError } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: userId,
        action_type: 'plan_change',
        old_value: { plan: user.subscription_plan },
        new_value: { plan: newPlan.charAt(0).toUpperCase() + newPlan.slice(1) },
        reason: reason,
        stripe_object_id: subscription.id
      })

    console.log('✅ Plan change completed successfully')

    return new Response(JSON.stringify({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Plan change failed:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 