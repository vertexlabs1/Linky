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

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Starting promo expiration check...')

    // Call the database function to expire promos
    const { data: expiredCount, error: expireError } = await supabase
      .rpc('expire_expired_promos')

    if (expireError) {
      console.error('❌ Error expiring promos:', expireError)
      throw new Error(`Failed to expire promos: ${expireError.message}`)
    }

    console.log(`✅ Expired ${expiredCount} promos successfully`)

    // Get details of expired promos for notification
    const { data: expiredPromos, error: fetchError } = await supabase
      .from('expired_promos_admin')
      .select('*')

    if (fetchError) {
      console.error('❌ Error fetching expired promos:', fetchError)
    } else if (expiredPromos && expiredPromos.length > 0) {
      console.log(`📧 Found ${expiredPromos.length} expired promos to notify`)
      
      // Send notifications for expired promos (optional)
      for (const promo of expiredPromos) {
        try {
          // Send email notification to user about expired promo
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-promo-expired-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({
              email: promo.email,
              firstName: promo.first_name || 'there',
              promoType: promo.promo_type,
              expiredAt: promo.promo_expiration_date
            })
          })

          if (!emailResponse.ok) {
            console.warn(`⚠️ Failed to send expired promo notification to ${promo.email}`)
          } else {
            console.log(`✅ Sent expired promo notification to ${promo.email}`)
          }
        } catch (emailError) {
          console.warn(`⚠️ Email notification error for ${promo.email}:`, emailError)
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredCount,
        message: `Successfully expired ${expiredCount} promos`,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Promo expiration error:', error)
    
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