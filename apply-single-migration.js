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

async function applySingleMigration() {
  console.log('🔧 Applying single migration for promo tracking columns...')
  console.log('📡 Connecting to:', SUPABASE_URL)
  
  try {
    // Read the migration file
    const fs = await import('fs')
    const path = await import('path')
    
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250118_add_promo_tracking.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath)
      return
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    console.log('📝 Migration SQL loaded successfully')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}:`)
      console.log(statement)
      
      try {
        // Try to execute via REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY
          },
          body: JSON.stringify({ sql: statement })
        })
        
        if (response.ok) {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        } else {
          console.log(`❌ Statement ${i + 1} failed`)
          const errorText = await response.text()
          console.log(`Error details: ${errorText}`)
        }
      } catch (error) {
        console.log(`❌ Error executing statement ${i + 1}: ${error.message}`)
      }
    }
    
    console.log('\n📋 Summary:')
    console.log('If the automated approach failed, you will need to:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Copy and paste the migration SQL manually')
    console.log('3. Then run: node manual-user-update.js')
    
    console.log('\n📝 Migration SQL to copy:')
    console.log(migrationSQL)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

applySingleMigration() 