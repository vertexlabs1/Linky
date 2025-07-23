import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { userId, newPlan, reason } = await req.json()

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Update subscription in Stripe if they have an active subscription
    if (user.stripe_subscription_id) {
      const priceIds = {
        'Prospector': 'price_1RmIR6K06fIw6v4hEoGab0Ts',
        'Networker': 'price_1RmIR6K06fIw6v4hT68Bm0ST',
        'Rainmaker': 'price_1RmIR7K06fIw6v4h5ovxqVqW'
      }

      const newPriceId = priceIds[newPlan]
      if (!newPriceId) {
        throw new Error('Invalid plan selected')
      }

      // Update the subscription in Stripe
      await stripe.subscriptions.update(user.stripe_subscription_id, {
        items: [{
          id: (await stripe.subscriptions.retrieve(user.stripe_subscription_id)).items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations', // Pro-rate the change
      })
    }

    // Update user in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_plan: newPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, message: 'Plan updated successfully' }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}) 