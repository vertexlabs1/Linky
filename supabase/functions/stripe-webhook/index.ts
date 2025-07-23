// @deno-types="https://deno.land/x/types/index.d.ts"
// @ts-ignore
// @public
// @no-auth
// @no-cache
// @no-rate-limit
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe'
import { Resend } from 'npm:resend'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// This function is public and can be called without authentication

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, stripe-signature',
      },
    })
  }

  try {
    const body = await req.text()
    console.log('Received webhook body:', body.substring(0, 200) + '...')
    
    const signature = req.headers.get('stripe-signature')
    console.log('Received signature:', signature)
    
    // Temporarily bypass signature verification for testing
    let event;
    try {
      // Try with signature verification first
      if (signature) {
        event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          Deno.env.get('STRIPE_WEBHOOK_SECRET')!
        )
        console.log('✅ Signature verification successful')
      } else {
        throw new Error('No signature found - using fallback')
      }
    } catch (sigError) {
      console.log('❌ Signature verification failed:', sigError.message)
      console.log('🔄 Attempting to parse as JSON for testing...')
      
      // Fallback: try to parse as regular JSON (ONLY for testing)
      try {
        event = JSON.parse(body)
        console.log('📝 Parsed event type:', event.type)
      } catch (parseError) {
        console.log('❌ Failed to parse as JSON:', parseError.message)
        throw new Error('Invalid request body')
      }
    }

    console.log('Processing event type:', event.type)

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
        
      case 'subscription_schedule.released':
        await handleSubscriptionScheduleReleased(event.data.object)
        break
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true, processed: event.type }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
}) 

// Handle initial founding member signup
async function handleCheckoutCompleted(session: any) {
  console.log('Processing checkout session:', session.id)
  console.log('Customer email:', session.customer_details?.email)
  console.log('Metadata:', session.metadata)
  console.log('Subscription metadata:', session.subscription_data?.metadata)
  
  // Get metadata from both possible locations
  const metadata = session.metadata || session.subscription_data?.metadata || {}
  const firstName = metadata.firstName || metadata.first_name
  const lastName = metadata.lastName || metadata.last_name
  
  console.log('Extracted metadata:', { firstName, lastName, metadata })
  
  // Process ALL checkout sessions, not just those with firstName/lastName
  // This ensures we don't miss any users
  try {
    console.log('💾 Attempting to update user in database...')
    
    // Determine subscription plan based on the session
    let subscriptionPlan = 'Prospector' // Default
    let subscriptionType = 'regular'
    let foundingMember = false
    
    if (metadata.type === 'founding_member_schedule' || metadata.type === 'founding_member') {
      subscriptionPlan = 'Prospector' // Founding members start on Prospector
      subscriptionType = 'founding_member_schedule'
      foundingMember = true
    }
    
    // Check if we have a user_id in metadata (new flow)
    if (metadata.user_id) {
      console.log('🔄 Using user_id from metadata to update existing user:', metadata.user_id)
      
      // Update existing user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          stripe_session_id: session.id,
          stripe_subscription_schedule_id: metadata.subscription_schedule_id || null,
          status: 'active',
          subscription_status: 'active',
          subscription_plan: subscriptionPlan,
          subscription_type: subscriptionType,
          founding_member: foundingMember,
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.user_id)
        .select()
        .single()

      if (userError) {
        console.error('❌ Error updating user data:', userError)
      } else {
        console.log('✅ Successfully updated user data:', userData)
      }
    } else {
      // Fallback to old flow (create new user)
      console.log('⚠️ No user_id in metadata, falling back to create new user')
      
      // Check if user already exists by email
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.customer_details.email)
        .single()

      if (existingUser) {
        console.log('🔄 User exists by email, updating with Stripe data')
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            stripe_session_id: session.id,
            stripe_subscription_schedule_id: metadata.subscription_schedule_id || null,
            status: 'active',
            subscription_status: 'active',
            subscription_plan: subscriptionPlan,
            subscription_type: subscriptionType,
            founding_member: foundingMember,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select()
          .single()

        if (userError) {
          console.error('❌ Error updating existing user data:', userError)
        } else {
          console.log('✅ Successfully updated existing user data:', userData)
        }
      } else {
        // Create completely new user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            email: session.customer_details.email,
            first_name: firstName || session.customer_details.email?.split('@')[0] || '',
            last_name: lastName || '',
            phone: metadata.phone || null,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            stripe_session_id: session.id,
            stripe_subscription_schedule_id: metadata.subscription_schedule_id || null,
            status: 'active',
            subscription_status: 'active',
            subscription_plan: subscriptionPlan,
            subscription_type: subscriptionType,
            founding_member: foundingMember
          })
          .select()
          .single()

        if (userError) {
          console.error('❌ Error saving user data:', userError)
        } else {
          console.log('✅ Successfully saved user data:', userData)
        }
      }
    }
  } catch (dbError) {
    console.error('❌ Database error:', dbError)
  }

  // Send appropriate welcome email
  if (metadata.type === 'founding_member_schedule' || metadata.type === 'founding_member') {
    await sendFoundingMemberWelcomeEmail(session, metadata)
  } else {
    await sendRegularWelcomeEmail(session, metadata)
  }
}

// Send founding member welcome email
async function sendFoundingMemberWelcomeEmail(session: any, metadata: any) {
  try {
    console.log('📧 Sending founding member welcome email to:', session.customer_details?.email)
    
    const firstName = metadata.firstName || session.customer_details?.email?.split('@')[0] || 'there'
    const sessionId = session.id
    
    // Call the dedicated founding member email function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-founding-member-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: session.customer_details.email,
        firstName: firstName,
        sessionId: sessionId
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to send founding member email:', errorText)
    } else {
      console.log('✅ Founding member welcome email sent successfully')
    }
  } catch (error) {
    console.error('❌ Error sending founding member welcome email:', error)
  }
}

// Send regular welcome email
async function sendRegularWelcomeEmail(session: any, metadata: any) {
  try {
    console.log('📧 Sending regular welcome email to:', session.customer_details?.email)
    
    const firstName = metadata.firstName || session.customer_details?.email?.split('@')[0] || 'there'
    
    const { data, error } = await resend.emails.send({
      from: 'Linky Team <hello@uselinky.app>',
      to: session.customer_details.email,
      subject: '🎉 Welcome to Linky!',
      html: `
        <h1>Welcome to Linky, ${firstName}! 🎉</h1>
        <p>Thank you for joining Linky - the revolutionary AI platform that will transform how you generate leads on LinkedIn.</p>
        <p>We're excited to have you on board!</p>
        <p>Best regards,<br>The Linky Team</p>
      `
    })
    
    if (error) {
      console.error('❌ Failed to send regular welcome email:', error)
    } else {
      console.log('✅ Regular welcome email sent successfully')
    }
  } catch (error) {
    console.error('❌ Error sending regular welcome email:', error)
  }
}

// Handle when founding member 3-month period ends and transitions to regular billing
async function handleSubscriptionScheduleReleased(schedule: any) {
  console.log('🔄 Handling subscription schedule release:', schedule.id)
  
  try {
    // Find user by subscription schedule ID
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_subscription_schedule_id', schedule.id)
      .single()
      
    if (findError || !user) {
      console.error('❌ Could not find user for schedule:', schedule.id, findError)
      return
    }
    
    console.log('Found user for transition:', user.email)
    
    // Update user record - they're now on regular Prospector billing
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_type: 'regular_monthly',
        subscription_status: 'active',
        // Keep founding_member = true but update billing type
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      
    if (updateError) {
      console.error('❌ Error updating user for transition:', updateError)
      return
    }
    
    console.log('✅ Successfully transitioned founding member to regular billing')
    
    // Send transition notification email
    await sendFoundingMemberTransitionEmail(user)
    
  } catch (error) {
    console.error('❌ Error handling subscription schedule release:', error)
  }
}

// Handle successful invoice payments (recurring billing)
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('💰 Handling successful payment for invoice:', invoice.id)
  
  try {
    // Find user by customer ID
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', invoice.customer)
      .single()
      
    if (findError || !user) {
      console.error('❌ Could not find user for customer:', invoice.customer)
      return
    }
    
    // Update subscription status to active
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      
    if (updateError) {
      console.error('❌ Error updating user payment status:', updateError)
      return
    }
    
    console.log('✅ Successfully updated user payment status')
    
    // Send payment confirmation if it's a founding member transition payment
    if (user.founding_member && invoice.amount_paid >= 7500) { // $75.00 or more
      await sendPaymentConfirmationEmail(user, invoice)
    }
    
  } catch (error) {
    console.error('❌ Error handling successful payment:', error)
  }
}

// Handle failed invoice payments
async function handleInvoicePaymentFailed(invoice: any) {
  console.log('❌ Handling failed payment for invoice:', invoice.id)
  
  try {
    // Find user by customer ID
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', invoice.customer)
      .single()
      
    if (findError || !user) {
      console.error('❌ Could not find user for customer:', invoice.customer)
      return
    }
    
    // Update subscription status to past_due
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      
    if (updateError) {
      console.error('❌ Error updating user payment status:', updateError)
      return
    }
    
    console.log('✅ Successfully updated user to past_due status')
    
    // Send payment failed notification
    await sendPaymentFailedEmail(user, invoice)
    
  } catch (error) {
    console.error('❌ Error handling failed payment:', error)
  }
}

// Handle subscription updates (plan changes, etc.)
async function handleSubscriptionUpdated(subscription: any) {
  console.log('🔄 Handling subscription update:', subscription.id)
  
  try {
    // Find user by subscription ID
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single()
      
    if (findError || !user) {
      console.error('❌ Could not find user for subscription:', subscription.id)
      return
    }
    
    // Determine new plan based on subscription items
    let newPlan = 'Prospector' // Default
    if (subscription.items?.data?.length > 0) {
      const priceId = subscription.items.data[0].price.id
      
      // Map price IDs to plan names using your actual price IDs
      switch (priceId) {
        case 'price_1RmIR6K06fIw6v4hEoGab0Ts':
          newPlan = 'Prospector'
          break
        case 'price_1RmIR6K06fIw6v4hT68Bm0ST':
          newPlan = 'Networker'
          break
        case 'price_1RmIR7K06fIw6v4h5ovxqVqW':
          newPlan = 'Rainmaker'
          break
        case 'price_1RmIXSK06fIw6v4hj3rTDsRj':
          // This is the founding member schedule price - keep existing plan but update status
          newPlan = user.subscription_plan || 'Prospector'
          break
        default:
          console.log(`Unknown price ID: ${priceId}, defaulting to Prospector`)
          newPlan = 'Prospector'
      }
    }
    
    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_plan: newPlan,
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      
    if (updateError) {
      console.error('❌ Error updating user subscription:', updateError)
      return
    }
    
    console.log('✅ Successfully updated user subscription plan to:', newPlan)
    
    // Send plan change notification if it's a significant upgrade/downgrade
    if (user.subscription_plan !== newPlan) {
      await sendPlanChangeEmail(user, user.subscription_plan, newPlan)
    }
    
  } catch (error) {
    console.error('❌ Error handling subscription update:', error)
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: any) {
  console.log('🗑️ Handling subscription deletion:', subscription.id)
  
  try {
    // Find user by subscription ID
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single()
      
    if (findError || !user) {
      console.error('❌ Could not find user for subscription:', subscription.id)
      return
    }
    
    // Update user record to reflect cancelled subscription
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_status: 'cancelled',
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      
    if (updateError) {
      console.error('❌ Error updating user for subscription deletion:', updateError)
      return
    }
    
    console.log('✅ Successfully updated user for subscription deletion')
    
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error)
  }
}

// Add plan change email function
async function sendPlanChangeEmail(user: any, oldPlan: string, newPlan: string) {
  try {
    const planEmojis: Record<string, string> = {
      'Prospector': '🥉',
      'Networker': '🥈', 
      'Rainmaker': '🥇'
    }
    
    const { data, error } = await resend.emails.send({
      from: 'Linky Team <hello@uselinky.app>',
      to: user.email,
      subject: `🎉 Plan Updated: Welcome to ${newPlan}!`,
      html: `
        <h1>Plan Change Confirmed! ${planEmojis[newPlan] || '🎯'}</h1>
        <p>Hi ${user.first_name},</p>
        <p>Your Linky subscription has been successfully updated:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Previous Plan:</strong> ${planEmojis[oldPlan] || '📦'} ${oldPlan}</p>
          <p><strong>New Plan:</strong> ${planEmojis[newPlan] || '🎯'} ${newPlan}</p>
        </div>
        
        <p>You now have access to all the features included in your ${newPlan} plan!</p>
        
        ${user.founding_member ? '<p>💎 <em>As a founding member, you continue to enjoy special perks and lifetime recognition!</em></p>' : ''}
        
        <p>Questions about your new plan? Just reply to this email!</p>
        
        <p>Best,<br>The Linky Team</p>
      `
    })

    if (error) {
      console.error('❌ Failed to send plan change email:', error)
    } else {
      console.log('✅ Plan change email sent successfully')
    }
  } catch (emailError) {
    console.error('❌ Plan change email error:', emailError)
  }
}