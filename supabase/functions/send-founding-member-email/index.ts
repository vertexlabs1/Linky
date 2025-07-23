import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('👑 Founding member email function called')

  try {
    const { email, firstName, lastName, sessionId } = await req.json()
    
    console.log('Sending founding member email to:', email, 'Name:', firstName)

    // Initialize Supabase client with hardcoded values for testing
    const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if user exists in auth.users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Failed to list auth users:', listError)
      await logError('auth_user_list_failure', listError.message, { email, sessionId })
      return new Response(
        JSON.stringify({ error: 'Failed to check auth users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const existingUser = authUsers.users.find(user => user.email === email)
    
    // If user doesn't exist in auth, create them first
    if (!existingUser) {
      console.log('Creating auth user for:', email)
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          founding_member: true
        }
      })

      if (createError) {
        console.error('Failed to create auth user:', createError)
        await logError('auth_user_creation_failure', createError.message, { email, sessionId })
        return new Response(
          JSON.stringify({ error: 'Failed to create auth user' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Created auth user:', newUser.user?.id)
    }

    // Generate password setup link
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://www.uselinky.app/setup-password'
      }
    })

    if (resetError) {
      console.error('Failed to generate reset link:', resetError)
      await logError('password_reset_link_failure', resetError.message, { email, sessionId })
      return new Response(
        JSON.stringify({ error: 'Failed to generate password setup link' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let passwordSetupUrl = resetData.properties.action_link
    
    // Log email attempt
    const emailLogId = await logEmailAttempt('founding_member_welcome', email, firstName, sessionId)

    // Send email with enhanced error handling
    const emailResult = await sendEmailWithRetry(email, firstName, passwordSetupUrl, sessionId, emailLogId)

    if (emailResult.success) {
      // Update email log as successful
      await updateEmailLog(emailLogId, 'sent', { resend_email_id: emailResult.emailId })
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Founding member email sent successfully',
          data: { id: emailResult.emailId },
          debug: {
            originalUrl: resetData.properties.action_link,
            finalUrl: passwordSetupUrl
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      // Log error and add to retry queue
      await logError('email_send_failure', emailResult.error, { email, sessionId, emailLogId })
      await addToRetryQueue('send_email', {
        email,
        firstName,
        passwordSetupUrl,
        sessionId,
        emailLogId
      }, 3) // High priority

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email failed to send, will retry automatically',
          retryQueued: true
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ Error in founding member email function:', error)
    await logError('email_function_failure', error.message, { 
      error: error.toString(),
      stack: error.stack 
    })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Enhanced email sending with retry logic
async function sendEmailWithRetry(email: string, firstName: string, passwordSetupUrl: string, sessionId: string, emailLogId: string) {
  const maxRetries = 3
  let lastError = ''

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Email attempt ${attempt}/${maxRetries} for ${email}`)
      
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
          // Add deliverability headers
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
      console.log(`✅ Email sent successfully on attempt ${attempt}:`, result.id)
      
      return { success: true, emailId: result.id }

    } catch (error) {
      lastError = error.message
      console.error(`❌ Email attempt ${attempt} failed:`, error.message)
      
      // Update email log with attempt
      await updateEmailLog(emailLogId, 'failed', { 
        attempt,
        error: error.message,
        retryCount: attempt - 1
      })

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  return { success: false, error: lastError }
}

// Generate the email HTML (your existing template)
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

// Helper functions for logging and retry queue
async function logError(errorType: string, message: string, details: any = {}) {
  const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    await supabase.from('error_logs').insert({
      error_type: errorType,
      error_message: message,
      error_details: details,
      email: details.email,
      stripe_session_id: details.sessionId
    })
  } catch (error) {
    console.error('Failed to log error:', error)
  }
}

async function logEmailAttempt(emailType: string, email: string, name: string, sessionId: string) {
  const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data, error } = await supabase.from('email_delivery_logs').insert({
      email_type: emailType,
      recipient_email: email,
      recipient_name: name,
      subject: '👑 Welcome to Linky - You\'re a Founding Member!',
      stripe_session_id: sessionId,
      status: 'pending'
    }).select('id').single()

    if (error) throw error
    return data.id
  } catch (error) {
    console.error('Failed to log email attempt:', error)
    return null
  }
}

async function updateEmailLog(logId: string, status: string, details: any = {}) {
  if (!logId) return

  const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    await supabase.from('email_delivery_logs').update({
      status: status,
      delivery_details: details,
      updated_at: new Date().toISOString()
    }).eq('id', logId)
  } catch (error) {
    console.error('Failed to update email log:', error)
  }
}

async function addToRetryQueue(operationType: string, operationData: any, priority: number = 1) {
  const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    await supabase.from('retry_queue').insert({
      operation_type: operationType,
      operation_data: operationData,
      priority: priority,
      next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
    })
  } catch (error) {
    console.error('Failed to add to retry queue:', error)
  }
} 