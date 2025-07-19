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

async function addDatabaseColumns() {
  console.log('🔧 Adding missing database columns...')
  console.log('📡 Connecting to:', SUPABASE_URL)
  
  try {
    // First, let's check the current table structure
    console.log('🔍 Checking current table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Error checking table structure:', tableError)
      return
    }
    
    console.log('✅ Table structure check successful')
    
    // Try to add columns one by one using direct SQL
    console.log('📝 Adding promo_active column...')
    try {
      const { error: alter1Error } = await supabase.rpc('sql', {
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;'
      })
      
      if (alter1Error) {
        console.log('⚠️ promo_active column might already exist or cannot be added:', alter1Error.message)
      } else {
        console.log('✅ promo_active column added successfully')
      }
    } catch (error) {
      console.log('⚠️ promo_active column might already exist:', error.message)
    }
    
    console.log('📝 Adding promo_type column...')
    try {
      const { error: alter2Error } = await supabase.rpc('sql', {
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;'
      })
      
      if (alter2Error) {
        console.log('⚠️ promo_type column might already exist or cannot be added:', alter2Error.message)
      } else {
        console.log('✅ promo_type column added successfully')
      }
    } catch (error) {
      console.log('⚠️ promo_type column might already exist:', error.message)
    }
    
    console.log('📝 Adding promo_expiration_date column...')
    try {
      const { error: alter3Error } = await supabase.rpc('sql', {
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;'
      })
      
      if (alter3Error) {
        console.log('⚠️ promo_expiration_date column might already exist or cannot be added:', alter3Error.message)
      } else {
        console.log('✅ promo_expiration_date column added successfully')
      }
    } catch (error) {
      console.log('⚠️ promo_expiration_date column might already exist:', error.message)
    }
    
    console.log('📝 Adding stripe_subscription_schedule_id column...')
    try {
      const { error: alter4Error } = await supabase.rpc('sql', {
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;'
      })
      
      if (alter4Error) {
        console.log('⚠️ stripe_subscription_schedule_id column might already exist or cannot be added:', alter4Error.message)
      } else {
        console.log('✅ stripe_subscription_schedule_id column added successfully')
      }
    } catch (error) {
      console.log('⚠️ stripe_subscription_schedule_id column might already exist:', error.message)
    }
    
    // Try to add subscription_type column if it doesn't exist
    console.log('📝 Adding subscription_type column...')
    try {
      const { error: alter5Error } = await supabase.rpc('sql', {
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT;'
      })
      
      if (alter5Error) {
        console.log('⚠️ subscription_type column might already exist or cannot be added:', alter5Error.message)
      } else {
        console.log('✅ subscription_type column added successfully')
      }
    } catch (error) {
      console.log('⚠️ subscription_type column might already exist:', error.message)
    }
    
    console.log('\n🎉 Database column addition completed!')
    console.log('📋 Next steps:')
    console.log('1. Run the manual user update script')
    console.log('2. Test the webhook functionality')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

addDatabaseColumns() 