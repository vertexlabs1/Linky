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

  console.log('👑 Admin resend welcome function called')

  try {
    const { email } = await req.json()
    
    console.log('Resending welcome email to:', email)

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

    // Check if auth user exists
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

    const existingAuthUser = authUsers.users.find(user => user.email === email)
    
    let authUserId = existingAuthUser?.id

    // If auth user doesn't exist, create it
    if (!existingAuthUser) {
      console.log('Creating auth user for:', email)
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          first_name: dbUser.first_name,
          last_name: dbUser.last_name
        }
      })
      
      if (createError) {
        console.error('Failed to create auth user:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create auth user', details: createError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      authUserId = newAuthUser.user.id
      console.log('Auth user created successfully:', authUserId)
    } else {
      console.log('Auth user already exists:', authUserId)
    }

    // Update database user with auth_user_id if not already set
    if (!dbUser.auth_user_id && authUserId) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          auth_user_id: authUserId,
          password_set: false,
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
      console.log('User record updated with auth_user_id')
    }

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
        JSON.stringify({ error: 'Failed to generate reset link' }),
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
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Auth user created/updated successfully',
        passwordSetupUrl: passwordSetupUrl,
        userId: dbUser.id,
        authUserId: authUserId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in admin resend welcome:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 