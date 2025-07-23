// @no-auth
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Email sending function
const sendWelcomeEmail = async (email: string, firstName?: string, lastName?: string) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.log('No Resend API key configured, skipping email')
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Linky <hello@linky.com>',
        to: email,
        subject: 'Welcome to Linky - You\'re on the waitlist! 🚀',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Linky</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f8fafc;
              }
              .container { 
                max-width: 600px; 
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
                font-size: 32px; 
                font-weight: bold; 
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
              }
              .logo-icon {
                background: #fbbf24;
                color: #1f2937;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 24px;
              }
              .subtitle { 
                font-size: 18px; 
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
              }
              .description { 
                font-size: 16px; 
                color: #6b7280; 
                margin-bottom: 30px;
                line-height: 1.7;
              }
              .features { 
                background: #f8fafc; 
                padding: 25px; 
                border-radius: 8px; 
                margin: 30px 0;
              }
              .feature { 
                display: flex; 
                align-items: center; 
                margin-bottom: 15px;
                font-size: 16px;
                color: #374151;
              }
              .feature:last-child { 
                margin-bottom: 0; 
              }
              .feature-icon { 
                color: #10b981; 
                margin-right: 12px; 
                font-size: 18px;
              }
              .cta-button { 
                display: inline-block; 
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                color: white; 
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
              .social-links { 
                margin: 20px 0; 
              }
              .social-link { 
                display: inline-block; 
                margin: 0 10px; 
                color: #6b7280; 
                text-decoration: none;
              }
              .unsubscribe { 
                font-size: 12px; 
                color: #9ca3af; 
                margin-top: 20px;
              }
              @media (max-width: 600px) {
                .container { margin: 10px; }
                .header { padding: 30px 20px; }
                .content { padding: 30px 20px; }
                .footer { padding: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">
                  <span class="logo-icon">🤖</span>
                  Linky
                </div>
                <p class="subtitle">Your AI-Powered LinkedIn Wingman</p>
              </div>
              
              <div class="content">
                <h1 class="welcome-text">Welcome to the future, ${firstName || 'there'}! 🎉</h1>
                
                <p class="description">
                  You're now on the exclusive waitlist for Linky - the revolutionary AI platform that will transform how you generate leads on LinkedIn.
                </p>
                
                <div class="features">
                  <div class="feature">
                    <span class="feature-icon">⚡</span>
                    <strong>Smart Engagement Tracking:</strong> Never miss a potential lead again
                  </div>
                  <div class="feature">
                    <span class="feature-icon">🎯</span>
                    <strong>AI-Powered Lead Scoring:</strong> Focus on your highest-value prospects
                  </div>
                  <div class="feature">
                    <span class="feature-icon">🤖</span>
                    <strong>Automated Outreach:</strong> Generate personalized comments and messages
                  </div>
                  <div class="feature">
                    <span class="feature-icon">📊</span>
                    <strong>Analytics Dashboard:</strong> Track your LinkedIn performance in real-time
                  </div>
                </div>
                
                <p class="description">
                  We're working hard to bring you the most powerful LinkedIn lead generation tool ever created. You'll be among the first to experience the future of social selling.
                </p>
                
                <p class="description">
                  <strong>What's next?</strong><br>
                  We'll notify you as soon as Linky is ready for early access. Founding members will get exclusive pricing and priority access to all features.
                </p>
                
                <div style="text-align: center;">
                  <a href="https://linky.com" class="cta-button">
                    Learn More About Linky
                  </a>
                </div>
              </div>
              
              <div class="footer">
                <div class="social-links">
                  <a href="https://twitter.com/linky" class="social-link">Twitter</a>
                  <a href="https://linkedin.com/company/linky" class="social-link">LinkedIn</a>
                  <a href="https://linky.com" class="social-link">Website</a>
                </div>
                
                <p>
                  <strong>The Linky Team</strong><br>
                  Building the future of LinkedIn lead generation
                </p>
                
                <div class="unsubscribe">
                  <p>
                    You received this email because you joined the Linky waitlist.<br>
                    <a href="https://linky.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9ca3af;">Unsubscribe</a> | 
                    <a href="https://linky.com/privacy" style="color: #9ca3af;">Privacy Policy</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        replyTo: 'support@linky.com',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Email sending failed:', error)
      return
    }

    console.log('Welcome email sent successfully to:', email)
  } catch (error) {
    console.error('Email sending error:', error)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    })
  }

  // Allow public access for waitlist signups (no auth required)
  console.log('Processing public waitlist signup request')

  try {
    console.log('Request received, parsing JSON...')
    const body = await req.json()
    console.log('Request body:', body)
    
    const { email, firstName, lastName } = body

    console.log('Processing waitlist signup:', { email, firstName, lastName })

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    // Get client info for tracking
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    const userAgent = req.headers.get('user-agent')
    const referrer = req.headers.get('referer')

    // Parse IP address properly (take first IP if multiple)
    const parsedIP = clientIP ? clientIP.split(',')[0].trim() : null

    // Simple direct insert approach with active boolean
    const subscriberData = {
      email: email.toLowerCase().trim(),
      first_name: firstName?.trim() || null,
      last_name: lastName?.trim() || null,
      ip_address: parsedIP,
      user_agent: userAgent,
      referrer: referrer,
      active: true
    }

    console.log('Attempting to insert subscriber data:', subscriberData)

    // Try to insert, handling duplicates
    const { data, error } = await supabase
      .from('email_subscribers')
      .upsert(subscriberData, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Database error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // If table doesn't exist, create a simple fallback
      if (error.code === '42P01') { // Table doesn't exist
        console.log('Table does not exist, creating simple record...')
        
        // Try inserting into users table as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .insert({
            email: email.toLowerCase().trim(),
            first_name: firstName?.trim() || 'Waitlist',
            last_name: lastName?.trim() || 'User',
            status: 'pending',
            subscription_plan: 'waitlist'
          })
          .select()
          .single()

        if (fallbackError && fallbackError.code !== '23505') { // Ignore duplicate key error
          console.error('Fallback error:', fallbackError)
          return new Response(
            JSON.stringify({ error: 'Failed to add to waitlist. Please try again.' }),
            { 
              status: 500, 
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            subscriberId: fallbackData?.id || 'fallback',
            isNewSignup: fallbackError?.code !== '23505',
            message: fallbackError?.code === '23505' ? 'Already on waitlist' : 'Added to waitlist'
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            } 
          }
        )
      }
      
      // Handle duplicate email error
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ 
            success: true,
            subscriberId: 'existing',
            isNewSignup: false,
            message: 'Already subscribed'
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          error: 'Failed to add to waitlist. Please try again.',
          details: error.message,
          code: error.code
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }
    
    console.log('Waitlist signup successful:', data)

    // Send welcome email if it's a new signup
    if (data.isNewSignup) {
      await sendWelcomeEmail(email, firstName, lastName)
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        subscriberId: data.id,
        isNewSignup: true,
        message: 'Successfully added to waitlist'
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )

  } catch (error) {
    console.error('Waitlist signup error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again.',
        details: error.message,
        stack: error.stack,
        name: error.name
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
}) 