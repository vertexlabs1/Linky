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

  console.log('📧 Welcome email function called')

  try {
    const { email, firstName, name, source } = await req.json()
    
    // Use firstName if provided, otherwise fall back to name
    const displayName = firstName || name || 'there'
    
    console.log('Sending welcome email to:', email, 'Name:', displayName, 'Source:', source)

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
        message: `Welcome email sent to ${email}`
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