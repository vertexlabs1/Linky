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

  console.log('🔧 Manual password setup function called')

  try {
    const { email, password } = await req.json()
    
    console.log('Setting up password for:', email)

    // Initialize Supabase client with hardcoded values
    const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if user exists in database
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

    // Try to create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: dbUser.first_name,
        last_name: dbUser.last_name
      }
    })

    if (authError) {
      console.error('Auth user creation failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user', details: authError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Auth user created:', authUser.user.id)

    // Update database user with auth_user_id
    const { error: updateError } = await supabase
      .from('users')
      .update({
        auth_user_id: authUser.user.id,
        password_set: true,
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', dbUser.id)

    if (updateError) {
      console.error('Failed to update user:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password set up successfully',
        userId: dbUser.id,
        authUserId: authUser.user.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in manual password setup:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 