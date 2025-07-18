import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

  console.log('👑 Founding member email function called')

  try {
    const { email, firstName, lastName, sessionId } = await req.json()
    
    console.log('Sending founding member email to:', email, 'Name:', firstName)

    // Create password setup link - use production domain
    const passwordSetupUrl = `https://www.uselinky.app/setup-password?email=${encodeURIComponent(email)}&session=${sessionId}`

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
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
              padding: 50px 30px; 
              text-align: center; 
              color: #1f2937;
              position: relative;
              overflow: hidden;
            }
            
            .logo { 
              font-size: 36px; 
              font-weight: bold; 
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              position: relative;
              z-index: 2;
            }
            
            .logo-icon {
              background: #1f2937;
              color: #fbbf24;
              padding: 12px 16px;
              border-radius: 12px;
              font-size: 28px;
              animation: bounce 2s ease-in-out infinite;
            }
            
            .content { 
              padding: 50px 30px; 
            }
            
            .welcome-text { 
              font-size: 32px; 
              font-weight: 700; 
              color: #1f2937; 
              margin-bottom: 25px;
              text-align: center;
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            .celebration-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              padding: 30px;
              border-radius: 16px;
              margin: 40px 0;
              border: 3px solid #fbbf24;
              text-align: center;
              position: relative;
            }
            
            .celebration-box::before {
              content: '🎉';
              position: absolute;
              top: -15px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 30px;
              background: white;
              padding: 5px 15px;
              border-radius: 20px;
              border: 3px solid #fbbf24;
            }
            
            .benefits { 
              background: #f8fafc; 
              padding: 30px; 
              border-radius: 16px; 
              margin: 40px 0;
              border-left: 5px solid #fbbf24;
            }
            
            .benefit { 
              display: flex; 
              align-items: center; 
              margin-bottom: 20px;
              font-size: 16px;
              color: #374151;
              padding: 15px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            
            .benefit-icon { 
              color: #d97706; 
              margin-right: 15px; 
              font-size: 24px;
              background: #fef3c7;
              padding: 10px;
              border-radius: 50%;
              min-width: 44px;
              text-align: center;
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
                    <span style="color: #6b7280; font-size: 14px;">Experience everything Linky has to offer!</span>
                  </div>
                </div>
                
                <div class="benefit">
                  <span class="benefit-icon">🤖</span>
                  <div>
                    <strong>Unlimited AI-Powered Lead Monitoring</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Let our AI find your perfect prospects!</span>
                  </div>
                </div>
                
                <div class="benefit">
                  <span class="benefit-icon">📊</span>
                  <div>
                    <strong>Real-time Analytics & Scoring</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Know exactly which leads to pursue!</span>
                  </div>
                </div>
                
                <div class="benefit">
                  <span class="benefit-icon">🗳️</span>
                  <div>
                    <strong>Feature Voting Rights</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Help us build the features you need!</span>
                  </div>
                </div>
                
                <div class="benefit">
                  <span class="benefit-icon">👥</span>
                  <div>
                    <strong>Private Community Access</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Connect with other founding members!</span>
                  </div>
                </div>
              </div>
              
              <div class="cta-section">
                <h3 style="margin: 0 0 20px 0; font-size: 24px; color: #fbbf24;">
                  🎯 NEXT STEP: SET UP YOUR ACCOUNT
                </h3>
                <p style="margin: 0 0 25px 0; font-size: 16px; opacity: 0.9;">
                  To access your exclusive founding member dashboard, you need to create your password:
                </p>
                
                <a href="${passwordSetupUrl}" class="cta-button">
                  ✨ CREATE MY PASSWORD ✨
                </a>
                
                <p style="font-size: 14px; opacity: 0.8; margin-top: 15px;">
                  This secure link will take you to your password setup page.
                </p>
              </div>
              
              <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 40px 0; text-align: center;">
                <h4 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">💎 FOUNDING MEMBER EXCLUSIVE</h4>
                <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.6;">
                  <strong>Special Offer:</strong> As one of our first 40 founding members, you're getting our premium features at just <strong>$25 for 3 months</strong> (normally $75/month)! This exclusive pricing is only available to founding members.
                </p>
              </div>
              
              <p style="font-size: 18px; color: #6b7280; text-align: center;">
                We can't wait to see you inside the platform, <strong>${firstName}</strong>! You're going to love what we've built for you.
              </p>
              
              <p style="font-size: 20px; font-weight: 600; color: #1f2937; text-align: center;">
                Welcome to the Linky family! 🚀
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 25px 0 15px 0;">
                <strong>The Linky Team</strong><br>
                Building the future of LinkedIn lead generation
              </p>
              
              <p style="font-size: 14px; color: #9ca3af; margin: 15px 0;">
                P.S. - Keep an eye on your inbox for exclusive founding member updates and early access to new features!
              </p>
              
              <div style="margin-top: 25px;">
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
        replyTo: 'support@linky.com',
      })
    })

    console.log('Resend API response status:', resendResponse.status)
    
    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend API error:', errorText)
      throw new Error(`Resend API error: ${resendResponse.status} ${errorText}`)
    }

    const data = await resendResponse.json()
    console.log('Founding member email sent successfully:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: `Founding member email sent to ${email}`
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error) {
    console.error('Error sending founding member email:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.toString()
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