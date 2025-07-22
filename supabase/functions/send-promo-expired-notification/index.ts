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
    const { email, firstName, promoType, expiredAt } = await req.json()
    const displayName = firstName || 'there'

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable not configured')
    }

    const getPromoDescription = (type: string) => {
      const descriptions = {
        'founding_member': 'Founding Member (3 months for $25)',
        'one_week_trial': '1 Week Trial (Free)',
        'beta_tester': 'Beta Tester (50% off)',
        'early_adopter': 'Early Adopter (25% off)'
      }
      return descriptions[type as keyof typeof descriptions] || type
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Linky Team <hello@uselinky.app>',
        to: [email],
        subject: 'Your Linky Promo Has Expired',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Promo Expired</h1>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="font-size: 18px; margin-bottom: 16px; color: #1e293b;">Hi ${displayName},</p>
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 16px;">
                Your <strong>${getPromoDescription(promoType)}</strong> promo has expired.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 16px;">
                You're now on our standard pricing. Don't worry - you can still access all your Linky features!
              </p>
            </div>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; color: white; text-align: center; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 20px;">Continue Using Linky</h3>
              <p style="margin: 0; font-size: 16px;">
                Your account is still active and you have full access to all features.
              </p>
            </div>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://www.uselinky.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Access Your Dashboard
              </a>
            </div>
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Need help?</strong> If you have any questions about your account or billing, please don't hesitate to reach out to our support team.
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
      throw new Error(`Failed to send email: ${errorText}`)
    }

    const result = await emailResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Promo expired notification sent successfully',
        email_id: result.id,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error sending promo expired notification:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}) 