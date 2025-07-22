import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('📧 Transition notification function called')
    const { email, firstName, transitionDate } = await req.json()
    const displayName = firstName || 'there'
    
    console.log('Sending transition notification to:', email, 'Name:', displayName)

    // Check for RESEND_API_KEY
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

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
        subject: '🎉 Your Linky Founding Member Period Has Ended - Welcome to Prospector!',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Welcome to Prospector! 🎉</h1>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="font-size: 18px; margin-bottom: 16px; color: #1e293b;">Hi ${displayName},</p>
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 16px;">
                Your 3-month founding member period has ended, and you've been automatically upgraded to our <strong>Prospector plan</strong> at $75/month.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 16px;">
                🚀 You now have access to our full AI-powered LinkedIn lead generation platform!
              </p>
            </div>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; color: white; text-align: center; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 20px;">What's Included in Prospector?</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 8px;">✨ AI-powered LinkedIn lead identification</li>
                <li style="margin-bottom: 8px;">🎯 Smart prospect scoring and insights</li>
                <li style="margin-bottom: 8px;">🤖 Automated personalized outreach</li>
                <li style="margin-bottom: 8px;">📈 Real-time analytics and conversion tracking</li>
                <li>💼 Advanced CRM integration</li>
              </ul>
            </div>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://www.uselinky.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Access Your Dashboard
              </a>
            </div>
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Billing Information:</strong> Your account will be charged $75/month starting today. You can manage your subscription anytime from your dashboard.
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

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('❌ Email send failed:', emailResponse.status, errorText)
      throw new Error(`Failed to send email: ${errorText}`)
    }

    const emailData = await emailResponse.json()
    console.log('✅ Transition notification sent successfully:', emailData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailData.id,
        message: 'Transition notification sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error sending transition notification:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 