import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

  console.log('📧 Welcome email function called')

  try {
    const { email, firstName, name, source } = await req.json()
    
    // Use firstName if provided, otherwise fall back to name
    const displayName = firstName || name || 'there'
    
    console.log('Sending welcome email to:', email, 'Name:', displayName, 'Source:', source)

    // Initialize Supabase client for password setup link generation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️ Supabase environment variables not fully configured, skipping password setup link generation')
    }

    let passwordSetupUrl = null;
    
    // Generate password setup link if Supabase is configured
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Check if user exists in auth.users
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
          console.error('Failed to list auth users:', listError)
        } else {
          const existingUser = authUsers.users.find(user => user.email === email)
          
          // If user doesn't exist in auth, create them first
          if (!existingUser) {
            console.log('Creating auth user for welcome email:', email)
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: email,
              email_confirm: true,
              user_metadata: {
                first_name: firstName || name || '',
                last_name: ''
              }
            })
            
            if (createError) {
              console.error('Failed to create auth user:', createError)
            } else {
              console.log('Auth user created successfully:', newUser.user.id)
            }
          }

          // Generate password setup link using Supabase Auth
          const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
              redirectTo: 'https://www.uselinky.app/setup-password'
            }
          })

          if (resetError) {
            console.error('Failed to generate password setup link:', resetError)
          } else {
            passwordSetupUrl = resetData.properties.action_link
            
            console.log('🔗 Original URL generated:', passwordSetupUrl)
            
            // Fix the URL if it's pointing to localhost (due to project site URL setting)
            if (passwordSetupUrl.includes('localhost:3000')) {
              passwordSetupUrl = passwordSetupUrl.replace('http://localhost:3000', 'https://www.uselinky.app')
              console.log('✅ Fixed localhost:3000 to production:', passwordSetupUrl)
            } else if (passwordSetupUrl.includes('localhost')) {
              passwordSetupUrl = passwordSetupUrl.replace('http://localhost', 'https://www.uselinky.app')
              console.log('✅ Fixed localhost to production:', passwordSetupUrl)
            } else if (passwordSetupUrl.includes('127.0.0.1:3000')) {
              passwordSetupUrl = passwordSetupUrl.replace('http://127.0.0.1:3000', 'https://www.uselinky.app')
              console.log('✅ Fixed 127.0.0.1:3000 to production:', passwordSetupUrl)
            } else if (passwordSetupUrl.includes('127.0.0.1')) {
              passwordSetupUrl = passwordSetupUrl.replace('http://127.0.0.1', 'https://www.uselinky.app')
              console.log('✅ Fixed 127.0.0.1 to production:', passwordSetupUrl)
            }
            
            // Verify final URL
            if (passwordSetupUrl.includes('localhost') || passwordSetupUrl.includes('127.0.0.1')) {
              console.log('⚠️ Warning: URL still contains localhost after replacement:', passwordSetupUrl)
            } else {
              console.log('✅ Final URL looks good:', passwordSetupUrl)
            }
          }
        }
      } catch (supabaseError) {
        console.error('Error with Supabase operations:', supabaseError)
      }
    }

    // Check for RESEND_API_KEY
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    console.log('✅ RESEND_API_KEY found, proceeding with email send...')

    // Use fetch instead of Resend SDK to avoid import issues
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Linky Team <hello@uselinky.app>',
        to: [email],
        subject: '🎉 Welcome to Linky - You\'re on the waitlist!',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Welcome to Linky! 🎉</h1>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="font-size: 18px; margin-bottom: 16px; color: #1e293b;">Hi ${displayName},</p>
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 16px;">
                Thank you for joining the Linky waitlist! We're excited to have you on board as we build the future of LinkedIn lead generation.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 16px;">
                🚀 You'll be among the first to know when we launch our AI-powered platform<br>
                💎 Plus, you'll get exclusive early access and special pricing!
              </p>
            </div>
            
            ${passwordSetupUrl ? `
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px; padding: 24px; color: white; text-align: center; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 20px;">🚀 Ready to Get Started?</h3>
              <p style="margin: 0 0 20px 0; opacity: 0.9;">Click the button below to set up your password and access your Linky dashboard!</p>
              <a href="${passwordSetupUrl}" style="display: inline-block; background: #fbbf24; color: #1f2937; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 10px 0;">
                🎯 SET UP MY ACCOUNT
              </a>
              <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.8;">This link will expire in 1 hour for your security.</p>
            </div>
            ` : ''}
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; color: white; text-align: center; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 20px;">What's Coming Next?</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 8px;">✨ AI-powered LinkedIn lead identification</li>
                <li style="margin-bottom: 8px;">🎯 Smart prospect scoring and insights</li>
                <li style="margin-bottom: 8px;">🤖 Automated personalized outreach</li>
                <li>📈 Real-time analytics and conversion tracking</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #64748b;">
                Stay tuned for updates - we'll be in touch soon with exciting news!
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
              <p style="font-size: 16px; color: #1e293b; margin-bottom: 8px;">
                Best regards,<br>
                <strong>The Linky Team</strong>
              </p>
              <p style="font-size: 14px; color: #64748b;">
                Building the future of LinkedIn lead generation 🚀
              </p>
            </div>
          </div>
        `,
      }),
    })

    console.log('📧 Resend API response status:', emailResponse.status)

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('❌ Resend API error:', errorText)
      throw new Error(`Resend API error: ${emailResponse.status} ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('✅ Welcome email sent successfully to:', email, 'Result:', emailResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: emailResult,
        message: `Welcome email sent to ${email}`,
        debug: {
          passwordSetupUrlGenerated: !!passwordSetupUrl,
          finalPasswordSetupUrl: passwordSetupUrl
        }
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        timestamp: new Date().toISOString()
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