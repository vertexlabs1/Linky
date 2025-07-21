-- Add promo tracking columns to users table
-- This migration adds the missing columns for proper Stripe integration

-- Add promo tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT;

-- Add constraints for valid promo types
ALTER TABLE users 
ADD CONSTRAINT valid_promo_types 
CHECK (promo_type IN ('founding_member', 'one_week_trial', 'beta_tester', 'early_adopter'));

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_promo_active ON users(promo_active) WHERE promo_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_promo_expiration ON users(promo_expiration_date) WHERE promo_active = TRUE;

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