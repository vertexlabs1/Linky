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
    const { email, firstName, lastName } = await req.json()
    
    console.log('Sending founding member email to:', email, 'Name:', firstName)

    // Initialize Supabase client with hardcoded values for testing
    const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if user exists in auth.users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Failed to list auth users:', listError)
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
          last_name: lastName || ''
        }
      })
      
      if (createError) {
        console.error('Failed to create auth user:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create auth user' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      console.log('Auth user created successfully:', newUser.user.id)
    }

    // Now generate password setup link using Supabase Auth
    // Note: The redirectTo will be overridden by the project's site URL setting
    // We need to manually construct the final URL
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://www.uselinky.app/setup-password'
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

    let passwordSetupUrl = resetData.properties.action_link
    
    console.log('🔗 Original URL generated:', passwordSetupUrl)
    
    // Fix the URL if it's pointing to localhost (due to project site URL setting)
    // Handle various localhost patterns
    if (passwordSetupUrl.includes('localhost:3000')) {
      passwordSetupUrl = passwordSetupUrl.replace('http://localhost:3000', 'https://www.uselinky.app')
      console.log('✅ Fixed localhost:3000 to production:', passwordSetupUrl)
    } else if (passwordSetupUrl.includes('localhost')) {
      passwordSetupUrl = passwordSetupUrl.replace('http://localhost', 'https://www.uselinky.app')
      console.log('✅ Fixed localhost to production:', passwordSetupUrl)
    } else if (passwordSetupUrl.includes('127.0.0.1')) {
      passwordSetupUrl = passwordSetupUrl.replace('http://127.0.0.1', 'https://www.uselinky.app')
      console.log('✅ Fixed 127.0.0.1 to production:', passwordSetupUrl)
    } else {
      console.log('ℹ️ URL does not contain localhost, using as-is:', passwordSetupUrl)
    }
    
    // Also check for any remaining localhost references in the URL
    if (passwordSetupUrl.includes('localhost') || passwordSetupUrl.includes('127.0.0.1')) {
      console.log('⚠️ Warning: URL still contains localhost after replacement:', passwordSetupUrl)
    } else {
      console.log('✅ Final URL looks good:', passwordSetupUrl)
    }

    // Use direct fetch to Resend API (same as working welcome email function)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Linky Team <hello@uselinky.app>',
        to: email,
        subject: '👑 YOU\'RE A LINKY FOUNDING MEMBER! 🚀',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Linky - Founding Member!</title>
          <style>
            @keyframes confetti {
              0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            
            @keyframes sparkle {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.2); }
            }
            
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-10px); }
              60% { transform: translateY(-5px); }
            }
            
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            
            .confetti {
              position: fixed;
              width: 10px;
              height: 10px;
              background: #fbbf24;
              animation: confetti 3s linear infinite;
              z-index: 1000;
            }
            
            .confetti:nth-child(2n) {
              background: #ef4444;
              animation-delay: 0.5s;
            }
            
            .confetti:nth-child(3n) {
              background: #10b981;
              animation-delay: 1s;
            }
            
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 20px; 
              overflow: hidden; 
              box-shadow: 0 25px 50px rgba(0,0,0,0.15);
              position: relative;
              z-index: 1;
            }
            
            .header { 
              background: linear-gradient(135deg, #1f2937 0%, #374151 100%); 
              padding: 50px 30px; 
              text-align: center; 
              color: white;
              position: relative;
            }
            
            .logo { 
              font-size: 36px; 
              font-weight: bold; 
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
            }
            
            .logo-icon {
              background: #fbbf24;
              color: #1f2937;
              padding: 12px 16px;
              border-radius: 12px;
              font-size: 28px;
              animation: sparkle 2s ease-in-out infinite;
            }
            
            .subtitle { 
              font-size: 18px; 
              opacity: 0.9; 
              margin: 0;
              font-weight: 500;
            }
            
            .content { 
              padding: 50px 30px; 
            }
            
            .welcome-text {
              font-size: 32px;
              font-weight: 800;
              color: #1f2937;
              margin-bottom: 30px;
              text-align: center;
              animation: bounce 2s ease-in-out infinite;
            }
            
            .celebration-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 3px solid #fbbf24;
              border-radius: 16px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
              box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
            }
            
            .benefits {
              margin: 40px 0;
            }
            
            .benefit {
              display: flex;
              align-items: flex-start;
              gap: 15px;
              margin-bottom: 20px;
              padding: 20px;
              background: #f8fafc;
              border-radius: 12px;
              border-left: 4px solid #3b82f6;
            }
            
            .benefit-icon {
              font-size: 24px;
              flex-shrink: 0;
            }
            
            .cta-section {
              background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
              padding: 40px 30px;
              border-radius: 16px;
              text-align: center;
              margin: 40px 0;
              color: white;
            }
            
            .cta-button { 
              display: inline-block; 
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
              color: #1f2937; 
              padding: 20px 40px; 
              text-decoration: none; 
              border-radius: 50px; 
              font-weight: 700; 
              font-size: 18px;
              margin: 20px 0;
              text-align: center;
              box-shadow: 0 10px 25px rgba(251, 191, 36, 0.4);
            }
            
            .exclusive-badge {
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              color: #1f2937;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              display: inline-block;
              margin-bottom: 20px;
            }
            
            .footer { 
              background: #f8fafc; 
              padding: 40px 30px; 
              text-align: center; 
              color: #6b7280;
              font-size: 14px;
            }
            
            @media (max-width: 600px) {
              .container { margin: 10px; }
              .header { padding: 40px 20px; }
              .content { padding: 40px 20px; }
              .footer { padding: 30px 20px; }
              .welcome-text { font-size: 28px; }
            }
          </style>
        </head>
        <body>
          <!-- Confetti Animation -->
          <div class="confetti" style="left: 10%; animation-delay: 0s;"></div>
          <div class="confetti" style="left: 20%; animation-delay: 0.5s;"></div>
          <div class="confetti" style="left: 30%; animation-delay: 1s;"></div>
          <div class="confetti" style="left: 40%; animation-delay: 1.5s;"></div>
          <div class="confetti" style="left: 50%; animation-delay: 2s;"></div>
          <div class="confetti" style="left: 60%; animation-delay: 0.3s;"></div>
          <div class="confetti" style="left: 70%; animation-delay: 0.8s;"></div>
          <div class="confetti" style="left: 80%; animation-delay: 1.3s;"></div>
          <div class="confetti" style="left: 90%; animation-delay: 1.8s;"></div>
          
          <div class="container">
            <div class="header">
              <div class="logo">
                <span class="logo-icon">👑</span>
                Linky
              </div>
              <p style="font-size: 20px; opacity: 0.9; margin: 0;">Founding Member Exclusive</p>
            </div>
            
            <div class="content">
              <div class="exclusive-badge">🎉 FOUNDING MEMBER #${Math.floor(Math.random() * 40) + 1} 🎉</div>
              
              <h1 class="welcome-text">CONGRATULATIONS, ${firstName}! 🚀</h1>
              
              <div class="celebration-box">
                <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #92400e;">
                  🎊 YOU'RE OFFICIALLY A FOUNDING MEMBER! 🎊
                </h2>
                <p style="margin: 0; font-size: 16px; color: #92400e; font-weight: 500;">
                  You've just joined an exclusive club of visionaries who will shape the future of LinkedIn lead generation!
                </p>
              </div>
              
              <p style="font-size: 18px; color: #6b7280; margin-bottom: 35px; line-height: 1.8; text-align: center;">
                <strong>WOW! 🎉</strong> We're absolutely thrilled to have you as one of our <strong>FOUNDING MEMBERS</strong>! 
                You've just joined an exclusive club of visionaries who will shape the future of LinkedIn lead generation.
              </p>
              
              <div class="benefits">
                <h3 style="margin: 0 0 25px 0; color: #1f2937; font-size: 20px;">💎 Your Exclusive Founding Member Benefits:</h3>
                
                <div class="benefit">
                  <span class="benefit-icon">🎯</span>
                  <div>
                    <strong>3 Months of Full MVP Features</strong><br>
                    <span style="color: #6b7280;">Access to all premium features including AI lead scoring, automated outreach, and advanced analytics.</span>
                  </div>
                </div>
                
                <div class="benefit">
                  <span class="benefit-icon">💰</span>
                  <div>
                    <strong>Special Founding Member Pricing</strong><br>
                    <span style="color: #6b7280;">Just $50 for 3 months - that's over 80% off our regular pricing!</span>
                  </div>
                </div>
                
                <div class="benefit">
                  <span class="benefit-icon">🚀</span>
                  <div>
                    <strong>Early Access to New Features</strong><br>
                    <span style="color: #6b7280;">Be the first to try cutting-edge AI features and provide feedback that shapes our roadmap.</span>
                  </div>
                </div>
                
                <div class="benefit">
                  <span class="benefit-icon">👥</span>
                  <div>
                    <strong>Exclusive Founding Member Community</strong><br>
                    <span style="color: #6b7280;">Join our private Discord/Slack for direct access to the team and fellow founding members.</span>
                  </div>
                </div>
                
                <div class="benefit">
                  <span class="benefit-icon">🎁</span>
                  <div>
                    <strong>Lifetime Founding Member Badge</strong><br>
                    <span style="color: #6b7280;">Show off your status as one of the original visionaries who believed in Linky from day one.</span>
                  </div>
                </div>
              </div>
              
              <div class="cta-section">
                <h3 style="margin: 0 0 20px 0; font-size: 24px;">🚀 Ready to Get Started?</h3>
                <p style="margin: 0 0 25px 0; font-size: 16px; opacity: 0.9;">
                  Click the button below to set up your password and access your exclusive founding member dashboard!
                </p>
                <a href="${passwordSetupUrl}" class="cta-button">
                  🎯 SET UP MY ACCOUNT NOW
                </a>
                <p style="margin: 20px 0 0 0; font-size: 14px; opacity: 0.8;">
                  This link will expire in 1 hour for your security.
                </p>
              </div>
              
              <p style="font-size: 16px; color: #6b7280; margin-bottom: 25px; line-height: 1.7; text-align: center;">
                <strong>What's Next?</strong><br>
                Once you set up your password, you'll have immediate access to:<br>
                • Your personalized dashboard<br>
                • AI-powered lead identification tools<br>
                • Automated outreach sequences<br>
                • Real-time analytics and insights
              </p>
              
              <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                <h4 style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 18px;">🎉 Welcome to the Future of LinkedIn Lead Generation!</h4>
                <p style="margin: 0; color: #0369a1; font-size: 16px; font-weight: 500;">
                  You're now part of an exclusive group that will revolutionize how businesses connect on LinkedIn.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <div style="margin: 20px 0;">
                <a href="https://twitter.com/linky" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Twitter</a>
                <a href="https://linkedin.com/company/linky" style="color: #6b7280; text-decoration: none; margin: 0 10px;">LinkedIn</a>
                <a href="https://linky.com" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Website</a>
              </div>
              
              <p style="margin: 20px 0;">
                <strong>The Linky Team</strong><br>
                Building the future of LinkedIn lead generation 🚀
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
        `,
      }),
    })

    console.log('📧 Resend API response status:', resendResponse.status)

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('❌ Resend API error:', errorText)
      throw new Error(`Resend API error: ${resendResponse.status} ${errorText}`)
    }

    const emailResult = await resendResponse.json()
    console.log('✅ Email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Founding member email sent successfully',
        data: emailResult,
        debug: {
          originalUrl: resetData.properties.action_link,
          finalUrl: passwordSetupUrl
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({ 
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