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

  console.log('🆘 Customer recovery function called')

  try {
    const { action, email } = await req.json()
    
    // Initialize Supabase client with hardcoded values
    const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'list') {
      // List all customers who paid but can't access service
      const { data: problemUsers, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'active')
        .is('auth_user_id', null)
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch problem users' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          problemUsers: problemUsers,
          count: problemUsers.length,
          message: `Found ${problemUsers.length} customers who paid but cannot access service`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'recover' && email) {
      console.log('Recovering customer:', email)

      // Find the user
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

      // Try to create auth user (this will likely fail due to database issue)
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true,
          user_metadata: {
            first_name: dbUser.first_name,
            last_name: dbUser.last_name
          }
        })

        if (authError) {
          return new Response(
            JSON.stringify({ 
              error: 'Database cannot create auth users',
              details: authError.message,
              user: dbUser,
              instructions: 'This requires Supabase support to fix the database issue'
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Update database user with auth_user_id
        const { error: updateError } = await supabase
          .from('users')
          .update({
            auth_user_id: authUser.user.id,
            password_set: false,
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', dbUser.id)

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to update user record' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Customer recovered successfully',
            user: dbUser,
            authUser: authUser.user
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      } catch (error) {
        return new Response(
          JSON.stringify({ 
            error: 'Database error creating auth user',
            details: error.message,
            user: dbUser,
            instructions: 'This requires immediate Supabase support attention'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "list" or "recover" with email' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in customer recovery:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 