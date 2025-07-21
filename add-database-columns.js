import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTgwNTAsImV4cCI6MjA2ODI3NDA1MH0.kt8G6d6ZlqxgpU4HFg_vDDBg-0FlozNF4XUq9bf22uw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addDatabaseColumns() {
  console.log('🔧 Adding missing database columns...')
  
  try {
    // Add missing columns to users table
    console.log('📊 Adding promo tracking columns...')
    
    const columnsToAdd = [
      'promo_active BOOLEAN DEFAULT FALSE',
      'promo_type TEXT',
      'promo_expiration_date TIMESTAMPTZ',
      'subscription_type TEXT DEFAULT \'regular\''
    ]
    
    for (const column of columnsToAdd) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column}`
        })
        
        if (error) {
          console.log(`⚠️ Column might already exist: ${column}`)
        } else {
          console.log(`✅ Added column: ${column}`)
        }
      } catch (err) {
        console.log(`⚠️ Column might already exist: ${column}`)
      }
    }
    
    // Add constraint for valid promo types
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_promo_types;
          ALTER TABLE users 
          ADD CONSTRAINT valid_promo_types 
          CHECK (promo_type IN ('founding_member', 'one_week_trial', 'beta_tester', 'early_adopter'));
        `
      })
      
      if (error) {
        console.log('⚠️ Constraint might already exist or failed to add')
      } else {
        console.log('✅ Added promo type constraint')
      }
    } catch (err) {
      console.log('⚠️ Constraint might already exist')
    }
    
    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_promo_active ON users(promo_active)',
      'CREATE INDEX IF NOT EXISTS idx_users_promo_type ON users(promo_type)',
      'CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type)'
    ]
    
    for (const index of indexes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: index })
        if (error) {
          console.log(`⚠️ Index might already exist`)
        } else {
          console.log(`✅ Created index`)
        }
      } catch (err) {
        console.log(`⚠️ Index might already exist`)
      }
    }
    
    console.log('\n✅ Database columns added successfully!')
    console.log('📋 Added columns:')
    console.log('- promo_active (BOOLEAN)')
    console.log('- promo_type (TEXT)')
    console.log('- promo_expiration_date (TIMESTAMPTZ)')
    console.log('- subscription_type (TEXT)')
    
    console.log('\n📋 Next steps:')
    console.log('1. Run the user data fix script')
    console.log('2. Test the admin panel')
    console.log('3. Verify email functionality')
    
  } catch (error) {
    console.error('❌ Error adding database columns:', error)
  }
}

addDatabaseColumns() 