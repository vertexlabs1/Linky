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

  console.log('📧 Manual password setup email function called')

  try {
    const { email } = await req.json()
    
    console.log('Sending password setup email to:', email)

    // Initialize Supabase client with hardcoded values
    const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user exists in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (dbError || !dbUser) {
      return new Response(
        JSON.stringify({ error: 'User not found in database' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Found user in database:', dbUser.id)

    // Generate password setup link
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
        JSON.stringify({ error: 'Failed to generate reset link', details: resetError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let passwordSetupUrl = resetData.properties.action_link
    
    // Fix the URL if it's pointing to localhost
    if (passwordSetupUrl.includes('localhost:3000')) {
      passwordSetupUrl = passwordSetupUrl.replace('http://localhost:3000', 'https://www.uselinky.app')
    } else if (passwordSetupUrl.includes('localhost')) {
      passwordSetupUrl = passwordSetupUrl.replace('http://localhost', 'https://www.uselinky.app')
    }

    console.log('Password setup URL generated:', passwordSetupUrl)

    // For now, return the URL directly since email is broken
    // In production, you would send this via email
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password setup link generated successfully',
        passwordSetupUrl: passwordSetupUrl,
        userId: dbUser.id,
        instructions: 'Copy this URL and send it to the user manually, or use it to set up their password'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in manual password setup email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 