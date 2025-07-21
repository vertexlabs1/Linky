import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@1.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, firstName } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate password reset link using Supabase Auth
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://www.uselinky.app/reset-password'
      }
    })

    if (resetError) {
      console.error('Failed to generate reset link:', resetError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset link' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let resetUrl = resetData.properties.action_link

    console.log('🔗 Original password reset URL generated:', resetUrl)

    // Fix the URL if it's pointing to localhost (due to project site URL setting)
    if (resetUrl.includes('localhost:3000')) {
      resetUrl = resetUrl.replace('http://localhost:3000', 'https://www.uselinky.app')
      console.log('✅ Fixed localhost:3000 to production:', resetUrl)
    } else if (resetUrl.includes('localhost')) {
      resetUrl = resetUrl.replace('http://localhost', 'https://www.uselinky.app')
      console.log('✅ Fixed localhost to production:', resetUrl)
    } else if (resetUrl.includes('127.0.0.1:3000')) {
      resetUrl = resetUrl.replace('http://127.0.0.1:3000', 'https://www.uselinky.app')
      console.log('✅ Fixed 127.0.0.1:3000 to production:', resetUrl)
    } else if (resetUrl.includes('127.0.0.1')) {
      resetUrl = resetUrl.replace('http://127.0.0.1', 'https://www.uselinky.app')
      console.log('✅ Fixed 127.0.0.1 to production:', resetUrl)
    }

    // Verify final URL
    if (resetUrl.includes('localhost') || resetUrl.includes('127.0.0.1')) {
      console.log('⚠️ Warning: Password reset URL still contains localhost after replacement:', resetUrl)
    } else {
      console.log('✅ Final password reset URL looks good:', resetUrl)
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // Create branded HTML email
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Linky Password</title>
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
          .title { 
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
          .reset-button { 
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
            width: 100%;
            box-sizing: border-box;
          }
          .warning { 
            background: #fef3c7; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 30px 0;
            border-left: 4px solid #fbbf24;
          }
          .warning-text { 
            font-size: 14px; 
            color: #92400e; 
            margin: 0;
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
            <h1 class="title">Reset Your Password</h1>
            
            <p class="description">
              Hi ${firstName || 'there'}, we received a request to reset your Linky password. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">
                Reset Password
              </a>
            </div>
            
            <div class="warning">
              <p class="warning-text">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in 1 hour for your security. If you didn't request this password reset, you can safely ignore this email.
              </p>
            </div>
            
            <p class="description">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
            </p>
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
                You received this email because you requested a password reset for your Linky account.<br>
                <a href="https://linky.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9ca3af;">Unsubscribe</a> | 
                <a href="https://linky.com/privacy" style="color: #9ca3af;">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Linky <no-reply@uselinky.app>',
      to: email,
      subject: 'Reset Your Linky Password',
      html: html,
      replyTo: 'support@uselinky.app',
    })

    if (error) {
      console.error('Email sending failed:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 