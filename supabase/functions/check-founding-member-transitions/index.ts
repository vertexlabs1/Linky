import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FoundingMember {
  id: string
  email: string
  first_name: string
  last_name: string
  stripe_customer_id?: string
  founding_member_purchased_at: string
  founding_member_transition_date: string
  founding_member_transitioned_at?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting founding member transition check...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get founding members that need transition
    const { data: foundingMembers, error: fetchError } = await supabase
      .from('founding_members_needing_transition')
      .select('*')

    if (fetchError) {
      console.error('❌ Error fetching founding members:', fetchError)
      throw fetchError
    }

    console.log(`📊 Found ${foundingMembers?.length || 0} founding members needing transition`)

    if (!foundingMembers || foundingMembers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No founding members need transition',
          processed: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each founding member
    for (const member of foundingMembers) {
      try {
        console.log(`🔄 Processing ${member.email}...`)
        
        // Check if they have a Stripe customer ID
        if (!member.stripe_customer_id) {
          console.log(`⚠️ No Stripe customer ID for ${member.email}, skipping`)
          results.errors.push(`${member.email}: No Stripe customer ID`)
          results.failed++
          continue
        }

        // Create new subscription in Stripe
        const stripeResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            customer: member.stripe_customer_id,
            items: '[{"price":"price_75_monthly"}]', // $75/month plan
            metadata: JSON.stringify({
              transitioned_from_founding_member: 'true',
              original_founding_member_id: member.id,
              transition_date: new Date().toISOString()
            })
          })
        })

        if (!stripeResponse.ok) {
          const errorData = await stripeResponse.text()
          console.error(`❌ Stripe error for ${member.email}:`, errorData)
          results.errors.push(`${member.email}: Stripe error - ${errorData}`)
          results.failed++
          continue
        }

        const stripeData = await stripeResponse.json()
        console.log(`✅ Stripe subscription created for ${member.email}:`, stripeData.id)

        // Update user in database
        const { error: updateError } = await supabase
          .from('users')
          .update({
            founding_member_transitioned_at: new Date().toISOString(),
            founding_member_transition_plan_id: 'price_75_monthly',
            subscription_plan: 'prospector',
            subscription_status: 'active',
            stripe_subscription_id: stripeData.id,
            current_plan_id: 'price_75_monthly',
            current_period_end: new Date(stripeData.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', member.id)

        if (updateError) {
          console.error(`❌ Database update error for ${member.email}:`, updateError)
          results.errors.push(`${member.email}: Database error - ${updateError.message}`)
          results.failed++
          continue
        }

        // Log the transition
        await supabase
          .from('billing_changes')
          .insert({
            user_id: member.id,
            change_type: 'subscription_change',
            old_values: {
              subscription_plan: 'founding_member',
              subscription_status: 'active'
            },
            new_values: {
              subscription_plan: 'prospector',
              subscription_status: 'active',
              stripe_subscription_id: stripeData.id
            },
            reason: 'Automatic founding member transition to $75/month plan',
            stripe_customer_id: member.stripe_customer_id,
            stripe_subscription_id: stripeData.id
          })

        // Send transition notification email
        try {
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-transition-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({
              email: member.email,
              firstName: member.first_name || 'there',
              transitionDate: new Date().toISOString()
            })
          })

          if (emailResponse.ok) {
            console.log(`📧 Transition notification sent to ${member.email}`)
          } else {
            console.warn(`⚠️ Failed to send transition notification to ${member.email}`)
          }
        } catch (emailError) {
          console.warn(`⚠️ Email notification error for ${member.email}:`, emailError)
        }

        console.log(`✅ Successfully transitioned ${member.email}`)
        results.successful++

      } catch (error) {
        console.error(`❌ Error processing ${member.email}:`, error)
        results.errors.push(`${member.email}: ${error.message}`)
        results.failed++
      }

      results.processed++
    }

    console.log(`✅ Founding member transition check completed:`, results)

    return new Response(
      JSON.stringify({
        message: 'Founding member transition check completed',
        ...results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in founding member transition check:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 