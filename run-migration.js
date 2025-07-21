import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTgwNTAsImV4cCI6MjA2ODI3NDA1MH0.kt8G6d6ZlqxgpU4HFg_vDDBg-0FlozNF4XUq9bf22uw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🔧 Running database migration...')
  
  try {
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250122_complete_billing_sync.sql', 'utf8')
    
    console.log('📄 Migration SQL loaded, executing...')
    
    // Execute the migration using RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      console.error('❌ Migration error:', error)
      return
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('📊 Added billing columns and constraints')
    
  } catch (error) {
    console.error('❌ Error running migration:', error)
  }
}

runMigration() 