import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, oldPlan, newPlan, newPrice } = await req.json()

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Linky Subscription Has Been Upgraded</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">🚀 Your Linky Plan Has Been Upgraded!</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <p>Hi ${name},</p>
              
              <p>Great news! Your 3-month Founding Member period has ended, and we've automatically upgraded you to our <strong>${newPlan}</strong> plan.</p>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">Plan Change Details:</h3>
                <p style="margin: 5px 0;"><strong>Previous:</strong> ${oldPlan} ($25 for 3 months)</p>
                <p style="margin: 5px 0;"><strong>New:</strong> ${newPlan} (${newPrice})</p>
                <p style="margin: 5px 0;"><strong>Billing:</strong> Monthly starting now</p>
              </div>
              
              <p>As a former founding member, you continue to have:</p>
              <ul>
                <li>✅ All the features you've been enjoying</li>
                <li>✅ Priority customer support</li>
                <li>✅ Early access to new features</li>
                <li>✅ Your founding member badge and recognition</li>
              </ul>
              
              <p>Thank you for being part of Linky's journey from the beginning. Your early support helped us build something amazing!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('VITE_APP_URL')}/dashboard" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Your Dashboard
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>Need help? Contact us at <a href="mailto:support@linky.com">support@linky.com</a></p>
              <p>You can manage your subscription anytime in your <a href="${Deno.env.get('VITE_APP_URL')}/dashboard/settings">account settings</a>.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Linky <noreply@linky.com>',
        to: [email],
        subject: 'Your Linky Plan Has Been Upgraded to Prospector',
        html: emailHtml,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      const error = await res.text()
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}) 