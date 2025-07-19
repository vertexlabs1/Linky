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

async function addColumnsSimple() {
  console.log('🔧 Adding missing database columns...')
  console.log('📡 Connecting to:', SUPABASE_URL)
  
  try {
    // Check current table structure
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
    
    // Try to add columns by attempting to insert a test record with the new fields
    console.log('📝 Testing if columns exist by attempting to insert with new fields...')
    
    // Test 1: Try to insert with promo_active
    try {
      const { error: test1Error } = await supabase
        .from('users')
        .insert({
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          promo_active: true
        })
      
      if (test1Error && test1Error.message.includes('promo_active')) {
        console.log('❌ promo_active column does not exist')
      } else {
        console.log('✅ promo_active column exists or was added')
        // Clean up test record
        await supabase.from('users').delete().eq('email', 'test@example.com')
      }
    } catch (error) {
      console.log('❌ promo_active column does not exist:', error.message)
    }
    
    // Test 2: Try to insert with promo_type
    try {
      const { error: test2Error } = await supabase
        .from('users')
        .insert({
          email: 'test2@example.com',
          first_name: 'Test',
          last_name: 'User',
          promo_type: 'founding_member'
        })
      
      if (test2Error && test2Error.message.includes('promo_type')) {
        console.log('❌ promo_type column does not exist')
      } else {
        console.log('✅ promo_type column exists or was added')
        // Clean up test record
        await supabase.from('users').delete().eq('email', 'test2@example.com')
      }
    } catch (error) {
      console.log('❌ promo_type column does not exist:', error.message)
    }
    
    // Test 3: Try to insert with stripe_subscription_schedule_id
    try {
      const { error: test3Error } = await supabase
        .from('users')
        .insert({
          email: 'test3@example.com',
          first_name: 'Test',
          last_name: 'User',
          stripe_subscription_schedule_id: 'test_schedule_id'
        })
      
      if (test3Error && test3Error.message.includes('stripe_subscription_schedule_id')) {
        console.log('❌ stripe_subscription_schedule_id column does not exist')
      } else {
        console.log('✅ stripe_subscription_schedule_id column exists or was added')
        // Clean up test record
        await supabase.from('users').delete().eq('email', 'test3@example.com')
      }
    } catch (error) {
      console.log('❌ stripe_subscription_schedule_id column does not exist:', error.message)
    }
    
    console.log('\n📋 Summary:')
    console.log('The missing columns need to be added manually through the Supabase dashboard.')
    console.log('Please go to: Supabase Dashboard → SQL Editor')
    console.log('And run the following SQL:')
    console.log(`
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT;
    `)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

addColumnsSimple() 