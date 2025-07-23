import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🔄 Processing retry queue...')

  try {
    const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get pending retry items
    const { data: retryItems, error: fetchError } = await supabase
      .from('retry_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('Failed to fetch retry items:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch retry items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!retryItems || retryItems.length === 0) {
      console.log('No retry items to process')
      return new Response(
        JSON.stringify({ message: 'No retry items to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${retryItems.length} retry items`)

    let processedCount = 0
    let successCount = 0
    let failureCount = 0

    for (const item of retryItems) {
      try {
        // Mark as processing
        await supabase
          .from('retry_queue')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', item.id)

        // Process based on operation type
        let success = false
        switch (item.operation_type) {
          case 'send_email':
            success = await processEmailRetry(item.operation_data, supabase)
            break
          case 'process_webhook':
            success = await processWebhookRetry(item.operation_data, supabase)
            break
          case 'update_user':
            success = await processUserUpdateRetry(item.operation_data, supabase)
            break
          default:
            console.error('Unknown operation type:', item.operation_type)
            success = false
        }

        // Update retry queue item
        if (success) {
          await supabase
            .from('retry_queue')
            .update({ 
              status: 'success', 
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
          successCount++
        } else {
          const newRetryCount = item.retry_count + 1
          const shouldRetry = newRetryCount < item.max_retries
          
          await supabase
            .from('retry_queue')
            .update({ 
              status: shouldRetry ? 'pending' : 'failed',
              retry_count: newRetryCount,
              next_retry_at: shouldRetry ? 
                new Date(Date.now() + Math.pow(2, newRetryCount) * 5 * 60 * 1000).toISOString() : 
                null,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
          
          if (!shouldRetry) {
            failureCount++
          }
        }

        processedCount++

      } catch (error) {
        console.error(`Error processing retry item ${item.id}:`, error)
        failureCount++
        
        // Mark as failed
        await supabase
          .from('retry_queue')
          .update({ 
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
      }
    }

    console.log(`✅ Retry queue processing complete: ${processedCount} processed, ${successCount} successful, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        successful: successCount,
        failed: failureCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Retry queue processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Process email retry
async function processEmailRetry(operationData: any, supabase: any) {
  try {
    const { email, firstName, passwordSetupUrl, sessionId, emailLogId } = operationData

    console.log(`📧 Retrying email send to ${email}`)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Linky Team <hello@uselinky.app>',
        to: email,
        subject: '👑 Welcome to Linky - You\'re a Founding Member!',
        html: generateEmailHTML(firstName, passwordSetupUrl),
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Resend API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ Email retry successful:`, result.id)

    // Update email log
    if (emailLogId) {
      await supabase
        .from('email_delivery_logs')
        .update({
          status: 'sent',
          delivery_details: { resend_email_id: result.id, retry_successful: true },
          updated_at: new Date().toISOString()
        })
        .eq('id', emailLogId)
    }

    return true

  } catch (error) {
    console.error('Email retry failed:', error)
    return false
  }
}

// Process webhook retry
async function processWebhookRetry(operationData: any, supabase: any) {
  try {
    const { eventData, eventType } = operationData

    console.log(`🔄 Retrying webhook processing for ${eventType}`)

    // Call the webhook processing function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'retry_processing'
      },
      body: JSON.stringify(eventData)
    })

    if (!response.ok) {
      throw new Error(`Webhook retry failed: ${response.status}`)
    }

    console.log(`✅ Webhook retry successful`)
    return true

  } catch (error) {
    console.error('Webhook retry failed:', error)
    return false
  }
}

// Process user update retry
async function processUserUpdateRetry(operationData: any, supabase: any) {
  try {
    const { userId, updates } = operationData

    console.log(`👤 Retrying user update for ${userId}`)

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (error) {
      throw error
    }

    console.log(`✅ User update retry successful`)
    return true

  } catch (error) {
    console.error('User update retry failed:', error)
    return false
  }
}

// Generate email HTML (same as in send-founding-member-email)
function generateEmailHTML(firstName: string, passwordSetupUrl: string) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Linky - Founding Member!</title>
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #374151;
        margin: 0;
        padding: 0;
        background-color: #f8fafc;
      }
      
      .container { 
        max-width: 500px; 
        margin: 0 auto; 
        background: white; 
        border-radius: 12px; 
        overflow: hidden; 
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .header { 
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
        padding: 40px 30px; 
        text-align: center; 
        color: white;
      }
      
      .logo { 
        font-size: 28px; 
        font-weight: bold; 
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      
      .logo-icon {
        background: #fbbf24;
        color: #1f2937;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 20px;
      }
      
      .subtitle { 
        font-size: 16px; 
        opacity: 0.9; 
        margin: 0;
      }
      
      .content { 
        padding: 40px 30px; 
      }
      
      .welcome-text { 
        font-size: 24px; 
        font-weight: 600; 
        color: #1f2937; 
        margin-bottom: 20px;
        text-align: center;
      }
      
      .description { 
        font-size: 16px; 
        color: #6b7280; 
        margin-bottom: 30px;
        line-height: 1.7;
        text-align: center;
      }
      
      .benefits { 
        background: #f8fafc; 
        padding: 25px; 
        border-radius: 8px; 
        margin: 30px 0;
        border-left: 4px solid #3b82f6;
      }
      
      .benefit { 
        display: flex; 
        align-items: center; 
        margin-bottom: 15px;
        font-size: 15px;
        color: #374151;
      }
      
      .benefit:last-child { 
        margin-bottom: 0; 
      }
      
      .benefit-icon { 
        color: #3b82f6; 
        margin-right: 12px; 
        font-size: 16px;
        flex-shrink: 0;
      }
      
      .cta-button { 
        display: inline-block; 
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
        color: #1f2937; 
        padding: 16px 32px; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: 600; 
        font-size: 16px;
        margin: 20px 0;
        text-align: center;
      }
      
      .footer { 
        background: #f8fafc; 
        padding: 30px; 
        text-align: center; 
        color: #6b7280;
        font-size: 14px;
      }
      
      .founding-badge {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #1f2937;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-block;
        margin-bottom: 20px;
      }
      
      @media (max-width: 600px) {
        .container { margin: 10px; }
        .header { padding: 30px 20px; }
        .content { padding: 30px 20px; }
        .footer { padding: 20px; }
        .welcome-text { font-size: 20px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">
          <img src="https://www.uselinky.app/logo.png" alt="Linky" style="height: 32px; width: auto; margin-right: 12px;">
          Linky
        </div>
        <p class="subtitle">Founding Member Exclusive</p>
      </div>
      
      <div class="content">
        <div class="founding-badge">🎉 Founding Member #${Math.floor(Math.random() * 50) + 1} 🎉</div>
        
        <h1 class="welcome-text">Welcome to Linky, ${firstName}! 🚀</h1>
        
        <p class="description">
          You're now a <strong>Founding Member</strong> of Linky - the AI platform that will revolutionize how you generate leads on LinkedIn.
        </p>
        
        <div class="benefits">
          <div class="benefit">
            <span class="benefit-icon">⚡</span>
            <strong>3 Months of Full Access</strong> - All premium features included
          </div>
          <div class="benefit">
            <span class="benefit-icon">💰</span>
            <strong>Special Pricing</strong> - Just $50 for 3 months (80% off!)
          </div>
          <div class="benefit">
            <span class="benefit-icon">🎯</span>
            <strong>Early Access</strong> - First to try new AI features
          </div>
          <div class="benefit">
            <span class="benefit-icon">👥</span>
            <strong>Exclusive Community</strong> - Direct access to our team
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="${passwordSetupUrl}" class="cta-button">
            Set Up Your Account
          </a>
        </div>
        
        <p class="description" style="font-size: 14px; margin-top: 30px;">
          <strong>What's next?</strong><br>
          Set up your password to access your dashboard and start generating leads with AI.
        </p>
      </div>
      
      <div class="footer">
        <p>
          <strong>The Linky Team</strong><br>
          Building the future of LinkedIn lead generation
        </p>
        
        <div style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
          <p>
            You received this email because you're a founding member of Linky.<br>
            <a href="https://linky.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9ca3af;">Unsubscribe</a> | 
            <a href="https://linky.com/privacy" style="color: #9ca3af;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
} 