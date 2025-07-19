import { createClient } from '@supabase/supabase-js'

// Configuration - using the same setup as other scripts
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jydldvvsxwosyzwttmui.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.log('Please set it in your environment or pass it directly to the script')
  console.log('Get this from: Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fixStripeIntegration() {
  console.log('🔧 Starting Stripe integration fix...')
  
  try {
    // Step 1: Add missing database columns
    console.log('📝 Adding missing database columns...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
      `
    })
    
    if (alterError) {
      console.error('❌ Error adding columns:', alterError)
      return
    }
    console.log('✅ Database columns added successfully')
    
    // Step 2: Add constraints
    console.log('🔒 Adding constraints...')
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users 
        ADD CONSTRAINT valid_promo_types 
        CHECK (promo_type IN ('founding_member', 'one_week_trial', 'beta_tester', 'early_adopter'));
      `
    })
    
    if (constraintError) {
      console.log('⚠️ Constraint might already exist:', constraintError.message)
    } else {
      console.log('✅ Constraints added successfully')
    }
    
    // Step 3: Create indexes
    console.log('📊 Creating indexes...')
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_users_promo_active ON users(promo_active) WHERE promo_active = TRUE;
        CREATE INDEX IF NOT EXISTS idx_users_promo_expiration ON users(promo_expiration_date) WHERE promo_active = TRUE;
      `
    })
    
    if (indexError) {
      console.log('⚠️ Indexes might already exist:', indexError.message)
    } else {
      console.log('✅ Indexes created successfully')
    }
    
    // Step 4: Update current user (Tyler Amos)
    console.log('👤 Updating current user record...')
    const { error: updateError } = await supabase
      .from('users')
      .update({
        promo_active: true,
        promo_type: 'founding_member',
        promo_expiration_date: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000), // 3 months from now
        stripe_subscription_schedule_id: 'sub_sched_1RmLeEK06flw6v4hjaTSiqyw',
        stripe_customer_id: 'cus_ShlACaUBkEHvGI',
        stripe_subscription_id: 'sub_1RmLepK06flw6v4h58pajuqN',
        subscription_type: 'founding_member_schedule',
        subscription_plan: 'Prospector',
        subscription_status: 'active',
        founding_member: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'tyleramos2025@gmail.com')
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return
    }
    console.log('✅ User record updated successfully')
    
    // Step 5: Create views
    console.log('👁️ Creating management views...')
    const { error: viewError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE VIEW active_promos AS
        SELECT 
          id, email, first_name, last_name, promo_type, promo_expiration_date,
          subscription_plan, subscription_status, created_at
        FROM users 
        WHERE promo_active = TRUE AND promo_expiration_date > NOW();
        
        CREATE OR REPLACE VIEW expired_promos AS
        SELECT 
          id, email, first_name, last_name, promo_type, promo_expiration_date,
          subscription_plan, subscription_status, created_at
        FROM users 
        WHERE promo_active = TRUE AND promo_expiration_date <= NOW();
      `
    })
    
    if (viewError) {
      console.log('⚠️ Views might already exist:', viewError.message)
    } else {
      console.log('✅ Views created successfully')
    }
    
    // Step 6: Verify the update
    console.log('🔍 Verifying the update...')
    const { data: userData, error: verifyError } = await supabase
      .from('users')
      .select(`
        email, first_name, last_name, 
        promo_active, promo_type, promo_expiration_date,
        stripe_customer_id, stripe_subscription_id, stripe_subscription_schedule_id,
        subscription_plan, subscription_status, founding_member
      `)
      .eq('email', 'tyleramos2025@gmail.com')
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
      return
    }
    
    console.log('✅ Verification successful!')
    console.log('📊 Updated user data:')
    console.log(JSON.stringify(userData, null, 2))
    
    console.log('\n🎉 Stripe integration fix completed successfully!')
    console.log('📋 Next steps:')
    console.log('1. Test the webhook by manually triggering the subscription schedule release')
    console.log('2. Verify the transition from $25/3months to $75/month works')
    console.log('3. Monitor webhook logs for subscription_schedule.released events')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixStripeIntegration() 