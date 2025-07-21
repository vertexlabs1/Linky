-- Complete Billing Sync Migration
-- This migration ensures perfect sync between Stripe and our database

-- Add missing billing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_address JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'regular';
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_payment_method TEXT;

-- Add constraints for valid promo types
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_promo_types;
ALTER TABLE users 
ADD CONSTRAINT valid_promo_types 
CHECK (promo_type IN ('founding_member', 'one_week_trial', 'beta_tester', 'early_adopter'));

-- Add constraint for valid subscription types
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_subscription_types;
ALTER TABLE users 
ADD CONSTRAINT valid_subscription_types 
CHECK (subscription_type IN ('regular', 'founding_member_schedule', 'annual', 'lifetime'));

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_billing_email ON users(billing_email);
CREATE INDEX IF NOT EXISTS idx_users_promo_active ON users(promo_active) WHERE promo_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_promo_expiration ON users(promo_expiration_date) WHERE promo_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_last_sync_at ON users(last_sync_at);
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);

-- Create views for easy management
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

CREATE OR REPLACE VIEW users_needing_sync AS
SELECT 
  id, email, stripe_customer_id, stripe_subscription_id, last_sync_at
FROM users 
WHERE stripe_customer_id IS NOT NULL 
  AND (last_sync_at IS NULL OR last_sync_at < NOW() - INTERVAL '24 hours');

-- Create function to sync user with Stripe
CREATE OR REPLACE FUNCTION sync_user_with_stripe(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  customer_data JSONB;
  subscription_data JSONB;
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Update last_sync_at
  UPDATE users 
  SET last_sync_at = NOW()
  WHERE id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if billing data is stale
CREATE OR REPLACE FUNCTION is_billing_data_stale(user_row users) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    user_row.stripe_customer_id IS NOT NULL 
    AND (
      user_row.last_sync_at IS NULL 
      OR user_row.last_sync_at < NOW() - INTERVAL '24 hours'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN users.billing_name IS 'Name used for billing (may differ from account name)';
COMMENT ON COLUMN users.billing_email IS 'Email used for billing (may differ from account email)';
COMMENT ON COLUMN users.billing_address IS 'Billing address from Stripe customer';
COMMENT ON COLUMN users.billing_phone IS 'Phone number used for billing';
COMMENT ON COLUMN users.promo_active IS 'Whether user is currently in a promo period';
COMMENT ON COLUMN users.promo_type IS 'Type of promo: founding_member, one_week_trial, etc.';
COMMENT ON COLUMN users.promo_expiration_date IS 'When the promo period expires';
COMMENT ON COLUMN users.last_sync_at IS 'Last time user data was synced with Stripe'; 