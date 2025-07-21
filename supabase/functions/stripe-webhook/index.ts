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
import { corsHeaders, handleCORS, createResponse, createErrorResponse } from '../utils/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

// Initialize Supabase client with service role for full access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORS(req)
  if (corsResponse) return corsResponse

  console.log('🔗 Stripe webhook received:', req.method, req.url)

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    // Strict signature verification
    if (!signature) {
      throw new Error('Missing Stripe signature header')
    }
    
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable not configured')
    }
    
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log('✅ Signature verification successful for event:', event.id)
    } catch (sigError) {
      console.error('❌ Signature verification failed:', sigError.message)
      throw new Error('Invalid webhook signature')
    }

    // Log webhook delivery for monitoring
    await logWebhookDelivery(event.id, event.type, 'delivered')

    // Store event in billing_events table for audit trail
    await logBillingEvent(event)

    // Process event with retry mechanism
    await processEventWithRetry(event)

    return createResponse({ 
      received: true, 
      event_id: event.id,
      event_type: event.type,
      processed: true 
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    
    // Log the failure
    if (error.event_id) {
      await logWebhookDelivery(error.event_id, error.event_type || 'unknown', 'failed', error.message)
    }
    
    // Alert admins for critical failures
    await alertAdmins(`Webhook processing failed: ${error.message}`)
    
    return createErrorResponse(error.message, 400)
  }
})

// Log webhook delivery for monitoring
async function logWebhookDelivery(
  stripeEventId: string, 
  eventType: string, 
  status: string, 
  errorMessage?: string
) {
  try {
    await supabase
      .from('webhook_deliveries')
      .insert({
        stripe_event_id: stripeEventId,
        event_type: eventType,
        delivery_status: status,
        delivered_at: status === 'delivered' ? new Date().toISOString() : null,
        error_message: errorMessage
      })
  } catch (error) {
    console.error('Failed to log webhook delivery:', error)
  }
}

// Log billing events for audit trail
async function logBillingEvent(event: Stripe.Event) {
  try {
    const { error } = await supabase
      .from('billing_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event,
        processed: false,
        created_at: new Date().toISOString()
      })

    if (error && !error.message.includes('duplicate')) {
      console.error('❌ Error logging billing event:', error)
    } else {
      console.log('✅ Billing event logged:', event.id)
    }
  } catch (error) {
    console.error('❌ Unexpected error logging billing event:', error)
  }
}

// Process events with retry mechanism
async function processEventWithRetry(event: Stripe.Event, retryCount = 0) {
  const maxRetries = 3
  const backoffDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff
  
  try {
    console.log(`🔄 Processing event ${event.id} (attempt ${retryCount + 1})`)
    
    // Update retry count in database
    await supabase
      .from('billing_events')
      .update({ retry_count: retryCount })
      .eq('stripe_event_id', event.id)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      case 'subscription_schedule.released':
        await handleSubscriptionScheduleReleased(event.data.object as Stripe.SubscriptionSchedule)
        break
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
        
      case 'customer.created':
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break
        
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
        // Still mark as processed since we don't need to handle every event type
        break
    }

    // Mark event as successfully processed
    await supabase
      .from('billing_events')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString(),
        error_message: null
      })
      .eq('stripe_event_id', event.id)

    console.log(`✅ Successfully processed event ${event.id}`)

  } catch (error) {
    console.error(`❌ Error processing event ${event.id}:`, error)
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying event ${event.id} in ${backoffDelay}ms (attempt ${retryCount + 1}/${maxRetries})`)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, backoffDelay))
      
      // Update webhook delivery status
      await supabase
        .from('webhook_deliveries')
        .update({
          delivery_status: 'retrying',
          retry_count: retryCount + 1,
          last_retry_at: new Date().toISOString()
        })
        .eq('stripe_event_id', event.id)
      
      return processEventWithRetry(event, retryCount + 1)
    } else {
      // Mark as failed after max retries
      await supabase
        .from('billing_events')
        .update({ 
          processed: false,
          error_message: error.message 
        })
        .eq('stripe_event_id', event.id)
      
      await supabase
        .from('webhook_deliveries')
        .update({
          delivery_status: 'failed',
          error_message: error.message
        })
        .eq('stripe_event_id', event.id)
      
      // Alert admins for critical failures
      await alertAdmins(`Failed to process event ${event.id} after ${maxRetries} retries: ${error.message}`)
      
      throw error
    }
  }
}

// Enhanced checkout completion handler with billing/account separation
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Processing checkout completion:', session.id)
  
  if (!session.customer || !session.subscription) {
    console.log('⚠️ Checkout session missing customer or subscription')
    return
  }

  try {
    // Get the subscription and customer to understand the plan
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const customer = await stripe.customers.retrieve(session.customer as string)
    
    // Determine plan from price ID
    const priceId = subscription.items.data[0]?.price.id
    const planName = getPlanNameFromPriceId(priceId)
    
    // Check if this is a founding member schedule
    const isFoundingMember = session.metadata?.type === 'founding_member_schedule'
    
    // Find user by email (account email) or create new user
    let user = await findOrCreateUser(customer.email, session.metadata)
    
    // Update user with both account and billing information
    const updateData = {
      // Account information (from metadata)
      first_name: session.metadata?.firstName || user.first_name,
      last_name: session.metadata?.lastName || user.last_name,
      phone: session.metadata?.phone || user.phone,
      
      // Stripe integration
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      stripe_subscription_schedule_id: session.subscription_schedule || null,
      
      // Subscription information
      subscription_plan: planName,
      subscription_status: subscription.status,
      subscription_type: isFoundingMember ? 'founding_member_schedule' : 'regular',
      
      // Billing information (from Stripe customer)
      billing_name: customer.name,
      billing_email: customer.email,
      billing_phone: customer.phone,
      billing_address: customer.address ? JSON.stringify(customer.address) : null,
      
      // Promo tracking for founding members
      promo_active: isFoundingMember,
      promo_type: isFoundingMember ? 'founding_member' : null,
      promo_expiration_date: isFoundingMember ? 
        new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      
      // Subscription periods
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      
      // Sync tracking
      last_sync_at: new Date().toISOString(),
      status: 'active'
    }
    
    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating user after checkout:', updateError)
      throw updateError
    }

    console.log('✅ User updated after checkout:', updatedUser?.email)
    console.log('📊 Billing name:', customer.name, 'Account name:', updatedUser?.first_name, updatedUser?.last_name)

    // Send appropriate welcome email
    if (isFoundingMember) {
      await sendFoundingMemberWelcomeEmail(updatedUser, session)
    } else {
      await sendRegularWelcomeEmail(updatedUser, session)
    }

  } catch (error) {
    console.error('❌ Error in handleCheckoutCompleted:', error)
    throw error
  }
}

// Handle subscription updates (plan changes, status changes)
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Processing subscription update:', subscription.id)
  
  try {
    // Get current plan from price ID
    const priceId = subscription.items.data[0]?.price.id
    const planName = getPlanNameFromPriceId(priceId)
    
    // Update user in database
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({
        subscription_plan: planName,
        subscription_status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        last_sync_at: new Date()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError)
      throw updateError
    }

    console.log('✅ Subscription updated for user:', user?.email)

  } catch (error) {
    console.error('❌ Error in handleSubscriptionUpdated:', error)
    throw error
  }
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Processing subscription cancellation:', subscription.id)
  
  try {
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        cancel_at_period_end: true,
        last_sync_at: new Date()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating canceled subscription:', updateError)
      throw updateError
    }

    console.log('✅ Subscription canceled for user:', user?.email)

    // Send cancellation email
    await sendCancellationEmail(user)

  } catch (error) {
    console.error('❌ Error in handleSubscriptionDeleted:', error)
    throw error
  }
}

// Handle founding member transition (3 months → regular billing)
async function handleSubscriptionScheduleReleased(schedule: Stripe.SubscriptionSchedule) {
  console.log('👑 Processing founding member transition:', schedule.id)
  
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
    
    console.log('👑 Found founding member for transition:', user.email)
    
    // Update user record - transition to regular billing
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_type: 'regular_monthly',
        subscription_status: 'active',
        promo_active: false,
        promo_expiration_date: new Date().toISOString(),
        last_sync_at: new Date()
      })
      .eq('id', user.id)
      
    if (updateError) {
      console.error('❌ Error updating founding member transition:', updateError)
      throw updateError
    }
    
    console.log('✅ Successfully transitioned founding member to regular billing')
    
    // Send transition notification email
    await sendFoundingMemberTransitionEmail(user)
    
  } catch (error) {
    console.error('❌ Error in handleSubscriptionScheduleReleased:', error)
    throw error
  }
}

// Handle successful payments
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Processing successful payment:', invoice.id)
  
  try {
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', invoice.customer)
      .single()
      
    if (findError || !user) {
      console.error('❌ Could not find user for payment:', invoice.customer)
      return
    }
    
    // Update subscription status to active
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_status: 'active',
        last_sync_at: new Date()
      })
      .eq('id', user.id)
      
    if (updateError) {
      console.error('❌ Error updating payment status:', updateError)
      throw updateError
    }
    
    console.log('✅ Payment confirmed for user:', user.email)
    
    // Send payment confirmation email
    await sendPaymentConfirmationEmail(user, invoice)
    
  } catch (error) {
    console.error('❌ Error in handleInvoicePaymentSucceeded:', error)
    throw error
  }
}

// Handle failed payments
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('💥 Processing failed payment:', invoice.id)
  
  try {
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', invoice.customer)
      .single()
      
    if (findError || !user) {
      console.error('❌ Could not find user for failed payment:', invoice.customer)
      return
    }
    
    // Update subscription status to past_due
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_status: 'past_due',
        last_sync_at: new Date()
      })
      .eq('id', user.id)
      
    if (updateError) {
      console.error('❌ Error updating failed payment status:', updateError)
      throw updateError
    }
    
    console.log('⚠️ Payment failed for user:', user.email)
    
    // Send payment failed notification
    await sendPaymentFailedEmail(user, invoice)
    
  } catch (error) {
    console.error('❌ Error in handleInvoicePaymentFailed:', error)
    throw error
  }
}

// Enhanced customer update handler
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('👤 Processing customer update:', customer.id)
  
  try {
    // Update billing information for all users with this customer ID
    const { error: updateError } = await supabase
      .from('users')
      .update({
        billing_name: customer.name,
        billing_email: customer.email,
        billing_phone: customer.phone,
        billing_address: customer.address ? JSON.stringify(customer.address) : null,
        last_sync_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customer.id)
      
    if (updateError) {
      console.error('❌ Error updating customer:', updateError)
      throw updateError
    }
    
    console.log('✅ Customer billing info updated:', customer.email)
    
  } catch (error) {
    console.error('❌ Error in handleCustomerUpdated:', error)
    throw error
  }
}

// Helper function to find or create user
async function findOrCreateUser(email: string, metadata: any) {
  // First try to find existing user by email
  let { data: user, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
    
  if (user) {
    console.log('✅ Found existing user:', user.email)
    return user
  }
  
  // Create new user if not found
  console.log('🆕 Creating new user for email:', email)
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email: email,
      first_name: metadata?.firstName || '',
      last_name: metadata?.lastName || '',
      phone: metadata?.phone || null,
      status: 'active'
    })
    .select()
    .single()
    
  if (createError) {
    console.error('❌ Error creating user:', createError)
    throw createError
  }
  
  console.log('✅ Created new user:', newUser.email)
  return newUser
}

// Helper function to get plan name from price ID
function getPlanNameFromPriceId(priceId: string): string {
  const priceIdMap: Record<string, string> = {
    'price_1RmIR6K06fIw6v4hEoGab0Ts': 'Prospector',
    'price_1RmIR6K06fIw6v4hT68Bm0ST': 'Networker', 
    'price_1RmIR7K06fIw6v4h5ovxqVqW': 'Rainmaker',
    'price_1RmIXSK06fIw6v4hj3rTDsRj': 'Founding Member'
  }
  
  return priceIdMap[priceId] || 'Prospector'
}

// Email functions
async function sendFoundingMemberWelcomeEmail(user: any, session: Stripe.Checkout.Session) {
  try {
    // Call the dedicated founding member email function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-founding-member-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        firstName: user.first_name,
        sessionId: session.id
      })
    })
    
    if (!response.ok) {
      throw new Error(`Email service responded with ${response.status}`)
    }
    
    console.log('✅ Founding member welcome email sent to:', user.email)
  } catch (error) {
    console.error('❌ Error sending founding member welcome email:', error)
  }
}

async function sendRegularWelcomeEmail(user: any, session: Stripe.Checkout.Session) {
  try {
    const { error } = await resend.emails.send({
      from: 'Linky <no-reply@uselinky.app>',
      to: user.email,
      subject: '🎉 Welcome to Linky!',
      html: `
        <h1>Welcome to Linky, ${user.first_name || 'there'}! 🎉</h1>
        <p>Thank you for joining Linky - the revolutionary AI platform that will transform how you generate leads on LinkedIn.</p>
        <p>Your subscription is now active and you have full access to all features.</p>
        <p>Get started by logging into your dashboard:</p>
        <a href="${Deno.env.get('SITE_URL') || 'https://www.uselinky.app'}/dashboard" 
           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Access Your Dashboard
        </a>
        <p>Best regards,<br>The Linky Team</p>
      `
    })
    
    if (error) {
      throw error
    }
    
    console.log('✅ Regular welcome email sent to:', user.email)
  } catch (error) {
    console.error('❌ Error sending regular welcome email:', error)
  }
}

async function sendFoundingMemberTransitionEmail(user: any) {
  try {
    const { error } = await resend.emails.send({
      from: 'Linky <no-reply@uselinky.app>',
      to: user.email,
      subject: '👑 Your Founding Member Period Has Ended',
      html: `
        <h1>Thank you for being a founding member, ${user.first_name}! 👑</h1>
        <p>Your 3-month founding member period has ended, and you've now been transitioned to our regular Prospector plan at $75/month.</p>
        <p>As a founding member, you'll always have special recognition and early access to new features.</p>
        <p>Questions about your billing? Contact us anytime.</p>
        <p>Best regards,<br>The Linky Team</p>
      `
    })
    
    console.log('✅ Founding member transition email sent to:', user.email)
  } catch (error) {
    console.error('❌ Error sending transition email:', error)
  }
}

async function sendPaymentConfirmationEmail(user: any, invoice: Stripe.Invoice) {
  try {
    const { error } = await resend.emails.send({
      from: 'Linky <no-reply@uselinky.app>',
      to: user.email,
      subject: '💳 Payment Confirmation',
      html: `
        <h1>Payment Confirmed! 💳</h1>
        <p>Hi ${user.first_name},</p>
        <p>We've successfully processed your payment of $${(invoice.amount_paid / 100).toFixed(2)}.</p>
        <p>Your subscription is active and all features are available.</p>
        <p>Receipt: ${invoice.hosted_invoice_url}</p>
        <p>Best regards,<br>The Linky Team</p>
      `
    })
    
    console.log('✅ Payment confirmation email sent to:', user.email)
  } catch (error) {
    console.error('❌ Error sending payment confirmation email:', error)
  }
}

async function sendPaymentFailedEmail(user: any, invoice: Stripe.Invoice) {
  try {
    const { error } = await resend.emails.send({
      from: 'Linky <no-reply@uselinky.app>',
      to: user.email,
      subject: '⚠️ Payment Failed - Action Required',
      html: `
        <h1>Payment Failed ⚠️</h1>
        <p>Hi ${user.first_name},</p>
        <p>We were unable to process your payment of $${(invoice.amount_due / 100).toFixed(2)}.</p>
        <p>Please update your payment method to continue using Linky:</p>
        <a href="${Deno.env.get('SITE_URL') || 'https://www.uselinky.app'}/dashboard/billing" 
           style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Update Payment Method
        </a>
        <p>Best regards,<br>The Linky Team</p>
      `
    })
    
    console.log('✅ Payment failed email sent to:', user.email)
  } catch (error) {
    console.error('❌ Error sending payment failed email:', error)
  }
}

async function sendCancellationEmail(user: any) {
  try {
    const { error } = await resend.emails.send({
      from: 'Linky <no-reply@uselinky.app>',
      to: user.email,
      subject: '😢 We\'re Sorry to See You Go',
      html: `
        <h1>Subscription Canceled 😢</h1>
        <p>Hi ${user.first_name},</p>
        <p>Your Linky subscription has been canceled. You'll continue to have access until the end of your current billing period.</p>
        <p>We'd love to have you back! If you change your mind, you can reactivate anytime.</p>
        <p>Best regards,<br>The Linky Team</p>
      `
    })
    
    console.log('✅ Cancellation email sent to:', user.email)
  } catch (error) {
    console.error('❌ Error sending cancellation email:', error)
  }
}

// Alert admins of critical issues
async function alertAdmins(message: string) {
  try {
    // Log to sync_health table
    await supabase
      .from('sync_health')
      .insert({
        sync_type: 'webhook',
        status: 'failure',
        error_details: { message, timestamp: new Date().toISOString() },
        started_at: new Date(),
        completed_at: new Date()
      })

    // Send email alert to admins
    const { data: admins } = await supabase
      .from('users')
      .select('email, first_name')
      .eq('is_admin', true)

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await resend.emails.send({
          from: 'Linky Alerts <alerts@uselinky.app>',
          to: admin.email,
          subject: '🚨 Linky System Alert',
          html: `
            <h1>System Alert 🚨</h1>
            <p>Hi ${admin.first_name},</p>
            <p>A critical issue occurred in the Linky billing system:</p>
            <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 16px 0;">
              <strong>Error:</strong> ${message}
            </div>
            <p>Time: ${new Date().toISOString()}</p>
            <p>Please check the admin dashboard for more details.</p>
          `
        })
      }
    }

    console.log('🚨 Admin alert sent:', message)
  } catch (error) {
    console.error('❌ Failed to send admin alert:', error)
  }
}