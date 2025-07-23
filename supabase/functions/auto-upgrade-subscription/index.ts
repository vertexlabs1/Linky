import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // This function can be called via:
    // 1. Scheduled cron job (check for subscriptions ending)
    // 2. Stripe webhook when subscription period ends
    // 3. Manual trigger for testing

    console.log('🔄 Starting auto-upgrade process...')

    // Find all founding members whose 3-month period is ending soon (within 3 days)
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const { data: foundingMembers, error: fetchError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('subscription_plan', 'founding_member')
      .eq('subscription_status', 'active')
      .not('stripe_customer_id', 'is', null)
      .lt('founding_member_expires_at', threeDaysFromNow.toISOString())

    if (fetchError) {
      throw new Error(`Error fetching founding members: ${fetchError.message}`)
    }

    console.log(`📊 Found ${foundingMembers?.length || 0} founding members to process`)

    const results = []

    for (const member of foundingMembers || []) {
      try {
        console.log(`🔄 Processing user ${member.email}...`)

        // Get current subscription from Stripe
        const customer = await stripe.customers.retrieve(member.stripe_customer_id)
        
        if (customer.deleted) {
          console.log(`⚠️ Customer ${member.stripe_customer_id} is deleted, skipping`)
          continue
        }

        const subscriptions = await stripe.subscriptions.list({
          customer: member.stripe_customer_id,
          status: 'active',
        })

        if (subscriptions.data.length === 0) {
          console.log(`⚠️ No active subscriptions for ${member.email}, skipping`)
          continue
        }

        const currentSubscription = subscriptions.data[0]

        // Cancel current founding member subscription
        await stripe.subscriptions.update(currentSubscription.id, {
          cancel_at_period_end: true,
        })

        // Create new Prospector subscription
        const prospectorPriceId = Deno.env.get('PROSPECTOR_PRICE_ID')
        if (!prospectorPriceId) {
          throw new Error('PROSPECTOR_PRICE_ID not found in environment variables')
        }

        const newSubscription = await stripe.subscriptions.create({
          customer: member.stripe_customer_id,
          items: [
            {
              price: prospectorPriceId,
            },
          ],
          metadata: {
            upgrade_from: 'founding_member',
            original_user_id: member.id,
          },
        })

        // Update user in database
        const { error: updateError } = await supabaseClient
          .from('users')
          .update({
            subscription_plan: 'prospector',
            subscription_status: 'active',
            stripe_subscription_id: newSubscription.id,
            upgraded_at: new Date().toISOString(),
            founding_member: false, // Keep the founding member flag for historical purposes
            founding_member_expired: true,
          })
          .eq('id', member.id)

        if (updateError) {
          console.error(`❌ Error updating user ${member.email}:`, updateError)
          results.push({
            user: member.email,
            success: false,
            error: updateError.message
          })
          continue
        }

        // Send upgrade notification email
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-upgrade-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: member.email,
              name: `${member.first_name} ${member.last_name}`,
              oldPlan: 'Founding Member',
              newPlan: 'Prospector',
              newPrice: '$75/month'
            })
          })
        } catch (emailError) {
          console.error(`⚠️ Failed to send upgrade email to ${member.email}:`, emailError)
        }

        console.log(`✅ Successfully upgraded ${member.email} to Prospector plan`)
        results.push({
          user: member.email,
          success: true,
          oldSubscription: currentSubscription.id,
          newSubscription: newSubscription.id
        })

      } catch (error) {
        console.error(`❌ Error processing ${member.email}:`, error)
        results.push({
          user: member.email,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Auto-upgrade function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 