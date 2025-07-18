import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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

  try {
    const { email } = await req.json()

    console.log('Sending password reset email to:', email)

    // Create password reset link
    const passwordResetUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:8082'}/setup-password?email=${encodeURIComponent(email)}&reset=true`

    const { data, error } = await resend.emails.send({
      from: 'Linky <hello@linky.com>',
      to: email,
      subject: '🔐 Reset Your Linky Password',
      html: `
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
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
            }
            
            .logo { 
              font-size: 36px; 
              font-weight: bold; 
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
            }
            
            .logo-icon {
              background: #1f2937;
              color: #fbbf24;
              padding: 12px 16px;
              border-radius: 12px;
              font-size: 28px;
            }
            
            .content { 
              padding: 50px 30px; 
            }
            
            .title { 
              font-size: 28px; 
              font-weight: 700; 
              color: #1f2937; 
              margin-bottom: 25px;
              text-align: center;
            }
            
            .description { 
              font-size: 18px; 
              color: #6b7280; 
              margin-bottom: 35px;
              line-height: 1.8;
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
              transition: all 0.3s ease;
            }
            
            .warning {
              background: #fef3c7;
              border: 2px solid #fbbf24;
              border-radius: 12px;
              padding: 25px;
              margin: 40px 0;
              text-align: center;
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
              .title { font-size: 24px; }
              .description { font-size: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <span class="logo-icon">🔗</span>
                Linky
              </div>
            </div>
            
            <div class="content">
              <h1 class="title">🔐 Reset Your Password</h1>
              
              <p class="description">
                We received a request to reset your Linky password. Click the button below to create a new password for your account.
              </p>
              
              <div class="cta-section">
                <h3 style="margin: 0 0 20px 0; font-size: 24px; color: #fbbf24;">
                  🎯 RESET YOUR PASSWORD
                </h3>
                <p style="margin: 0 0 25px 0; font-size: 16px; opacity: 0.9;">
                  This link will take you to a secure password reset page:
                </p>
                
                <a href="${passwordResetUrl}" class="cta-button">
                  🔐 RESET PASSWORD
                </a>
                
                <p style="font-size: 14px; opacity: 0.8; margin-top: 15px;">
                  This link will expire in 24 hours for security.
                </p>
              </div>
              
              <div class="warning">
                <h4 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">⚠️ Security Notice</h4>
                <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.6;">
                  If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
              
              <p class="description">
                Need help? Contact our support team at <strong>support@linky.com</strong>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 25px 0 15px 0;">
                <strong>The Linky Team</strong><br>
                Building the future of LinkedIn lead generation
              </p>
              
              <div style="font-size: 12px; color: #9ca3af; margin-top: 25px;">
                <p>
                  You received this email because a password reset was requested for your Linky account.<br>
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

    if (error) {
      console.error('Resend error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    console.log('Password reset email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return new Response(
      JSON.stringify({ 
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