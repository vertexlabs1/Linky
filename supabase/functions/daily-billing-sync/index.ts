import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

// Initialize Supabase client with service role for full access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // This function should be called via cron job or admin trigger
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  console.log('🔄 Starting daily billing sync...')
  
  const syncHealth = {
    sync_type: 'daily_sync',
    status: 'running',
    users_processed: 0,
    errors_encountered: 0,
    error_details: [] as any[],
    started_at: new Date().toISOString()
  }

  try {
    // Log sync start
    const { data: syncRecord } = await supabase
      .from('sync_health')
      .insert(syncHealth)
      .select()
      .single()

    // Get all users with Stripe subscriptions
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, stripe_subscription_id, stripe_customer_id, last_sync_at, subscription_status')
      .not('stripe_subscription_id', 'is', null)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    console.log(`📊 Found ${users?.length || 0} users with Stripe subscriptions`)

    const results = {
      synced: 0,
      errors: 0,
      errorDetails: [] as any[]
    }

    // Process each user
    for (const user of users || []) {
      try {
        console.log(`🔄 Syncing user: ${user.email}`)
        
        // Fetch fresh data from Stripe
        const [subscription, customer] = await Promise.all([
          stripe.subscriptions.retrieve(user.stripe_subscription_id),
          stripe.customers.retrieve(user.stripe_customer_id)
        ])

        // Determine plan from price ID
        const priceId = subscription.items.data[0]?.price.id
        const planName = getPlanNameFromPriceId(priceId)

        // Update database with fresh Stripe data
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_plan: planName,
            subscription_status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            billing_email: (customer as any).email,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`)
        }

        results.synced++
        console.log(`✅ Successfully synced: ${user.email}`)

      } catch (error) {
        console.error(`❌ Sync failed for user ${user.email}:`, error)
        results.errors++
        results.errorDetails.push({
          user_id: user.id,
          email: user.email,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Update sync health record
    const finalStatus = results.errors === 0 ? 'success' : 
                       results.errors < (users?.length || 0) * 0.1 ? 'partial' : 'failure'

    await supabase
      .from('sync_health')
      .update({
        status: finalStatus,
        users_processed: results.synced,
        errors_encountered: results.errors,
        error_details: results.errorDetails,
        completed_at: new Date().toISOString()
      })
      .eq('id', syncRecord?.id)

    // Send alerts for significant errors
    if (results.errors > 0) {
      await alertAdmins(`Daily sync completed with ${results.errors} errors out of ${users?.length || 0} users`)
    }

    // Health check - look for stale data and unprocessed events
    await performHealthChecks()

    console.log(`✅ Daily sync completed: ${results.synced} synced, ${results.errors} errors`)

    return new Response(JSON.stringify({
      success: true,
      synced: results.synced,
      errors: results.errors,
      status: finalStatus
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Daily sync failed completely:', error)
    
    // Update sync health record
    await supabase
      .from('sync_health')
      .update({
        status: 'failure',
        error_details: [{ error: error.message, timestamp: new Date().toISOString() }],
        completed_at: new Date().toISOString()
      })
      .eq('id', syncRecord?.id)

    await alertAdmins(`Daily sync failed completely: ${error.message}`)

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

// Perform additional health checks
async function performHealthChecks() {
  console.log('🔍 Performing health checks...')
  
  try {
    // Check for unprocessed billing events
    const { data: unprocessedEvents } = await supabase
      .from('billing_events')
      .select('id, stripe_event_id, event_type, created_at')
      .eq('processed', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (unprocessedEvents && unprocessedEvents.length > 0) {
      console.log(`⚠️ Found ${unprocessedEvents.length} unprocessed billing events`)
      await alertAdmins(`Found ${unprocessedEvents.length} unprocessed billing events from the last 24 hours`)
    }

    // Check for failed webhook deliveries
    const { data: failedWebhooks } = await supabase
      .from('webhook_deliveries')
      .select('id, stripe_event_id, event_type, error_message')
      .eq('delivery_status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (failedWebhooks && failedWebhooks.length > 0) {
      console.log(`⚠️ Found ${failedWebhooks.length} failed webhook deliveries`)
      await alertAdmins(`Found ${failedWebhooks.length} failed webhook deliveries from the last 24 hours`)
    }

    // Check for users with stale sync data (>48 hours)
    const { data: staleUsers } = await supabase
      .from('users')
      .select('id, email, last_sync_at')
      .not('stripe_subscription_id', 'is', null)
      .lt('last_sync_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())

    if (staleUsers && staleUsers.length > 0) {
      console.log(`⚠️ Found ${staleUsers.length} users with stale billing data`)
      await alertAdmins(`Found ${staleUsers.length} users with billing data older than 48 hours`)
    }

    // Check Stripe API connectivity
    try {
      await stripe.customers.list({ limit: 1 })
      console.log('✅ Stripe API connectivity check passed')
    } catch (stripeError) {
      console.error('❌ Stripe API connectivity check failed:', stripeError)
      await alertAdmins(`Stripe API connectivity failed: ${stripeError.message}`)
    }

    console.log('✅ Health checks completed')

  } catch (error) {
    console.error('❌ Health checks failed:', error)
    await alertAdmins(`Health checks failed: ${error.message}`)
  }
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

// Alert admins of issues
async function alertAdmins(message: string) {
  try {
    console.log('🚨 Sending admin alert:', message)

    // Get admin users
    const { data: admins } = await supabase
      .from('users')
      .select('email, first_name')
      .eq('is_admin', true)

    if (admins && admins.length > 0) {
      // Send email alerts
      for (const admin of admins) {
        await resend.emails.send({
          from: 'Linky System <alerts@uselinky.app>',
          to: admin.email,
          subject: '🚨 Linky Billing System Alert',
          html: `
            <h1>System Alert 🚨</h1>
            <p>Hi ${admin.first_name || 'Admin'},</p>
            <p>An issue was detected during the daily billing sync:</p>
            <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 16px 0;">
              <strong>Alert:</strong> ${message}
            </div>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p>Please check the admin dashboard for more details.</p>
            <p>Best regards,<br>Linky System</p>
          `
        })
      }
      console.log(`✅ Alert sent to ${admins.length} admins`)
    }

  } catch (error) {
    console.error('❌ Failed to send admin alerts:', error)
  }
} 