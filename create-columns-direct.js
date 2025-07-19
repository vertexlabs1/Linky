import { createClient } from '@supabase/supabase-js'

// Configuration - using the correct URL from the project
const SUPABASE_URL = 'https://jydldvvsxwosyzwttmui.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.log('Please set it in your environment:')
  console.log('export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"')
  console.log('Get this from: Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function createColumnsDirect() {
  console.log('🔧 Creating missing database columns...')
  console.log('📡 Connecting to:', SUPABASE_URL)
  
  try {
    // Try different approaches to add columns
    
    console.log('📝 Attempting to add columns using direct SQL...')
    
    // Approach 1: Try using the REST API with raw SQL
    console.log('🔄 Approach 1: Using REST API with raw SQL...')
    
    const sqlCommands = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT;'
    ]
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i]
      console.log(`📝 Executing: ${sql}`)
      
      try {
        // Try using the REST API to execute SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY
          },
          body: JSON.stringify({ sql })
        })
        
        if (response.ok) {
          console.log(`✅ Successfully executed: ${sql}`)
        } else {
          console.log(`❌ Failed to execute: ${sql}`)
          const errorText = await response.text()
          console.log(`Error details: ${errorText}`)
        }
      } catch (error) {
        console.log(`❌ Error executing SQL: ${error.message}`)
      }
    }
    
    // Approach 2: Try using a different RPC function
    console.log('\n🔄 Approach 2: Using different RPC function...')
    
    try {
      const { data, error } = await supabase.rpc('sql', {
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;'
      })
      
      if (error) {
        console.log('❌ RPC sql function failed:', error.message)
      } else {
        console.log('✅ RPC sql function worked')
      }
    } catch (error) {
      console.log('❌ RPC sql function not available:', error.message)
    }
    
    // Approach 3: Try using a custom function
    console.log('\n🔄 Approach 3: Using custom function...')
    
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;'
      })
      
      if (error) {
        console.log('❌ Custom execute_sql function failed:', error.message)
      } else {
        console.log('✅ Custom execute_sql function worked')
      }
    } catch (error) {
      console.log('❌ Custom execute_sql function not available:', error.message)
    }
    
    // Approach 4: Try to create a function first
    console.log('\n🔄 Approach 4: Creating SQL execution function...')
    
    try {
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
        END;
        $$;
      `
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({ sql: createFunctionSQL })
      })
      
      if (response.ok) {
        console.log('✅ Created execute_sql function')
        
        // Now try to use it
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;'
        })
        
        if (error) {
          console.log('❌ Still failed to execute SQL:', error.message)
        } else {
          console.log('✅ Successfully added promo_active column')
        }
      } else {
        console.log('❌ Failed to create execute_sql function')
      }
    } catch (error) {
      console.log('❌ Error creating function:', error.message)
    }
    
    console.log('\n📋 Summary:')
    console.log('If none of the above approaches worked, you will need to:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Run the SQL commands manually')
    console.log('3. Then run: node manual-user-update.js')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createColumnsDirect() 