-- ================================
-- IMPROVE SUBSCRIPTION STRUCTURE FOR FOUNDING MEMBERS
-- ================================

-- Add subscription_type column to track different subscription types
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT;

-- Add founding_member_promo_expires_at to track when the $25 promo ends
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_promo_expires_at TIMESTAMPTZ;

-- Add stripe_subscription_schedule_id to track the subscription schedule
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;

-- Update existing founding members with promo expiration (3 months from creation)
UPDATE users 
SET 
  founding_member_promo_expires_at = created_at + INTERVAL '3 months',
  subscription_type = 'founding_member_schedule'
WHERE founding_member = TRUE 
AND founding_member_promo_expires_at IS NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_founding_member_promo ON users(founding_member_promo_expires_at) 
WHERE founding_member = TRUE AND subscription_type = 'founding_member_schedule';

-- Add constraint for valid subscription types
ALTER TABLE users 
ADD CONSTRAINT valid_subscription_types 
CHECK (subscription_type IN ('regular_monthly', 'founding_member_schedule', 'annual', 'lifetime'));

-- Add comments to document the new structure
COMMENT ON COLUMN users.subscription_type IS 'Type of subscription: regular_monthly, founding_member_schedule, annual, lifetime';
COMMENT ON COLUMN users.founding_member_promo_expires_at IS 'When the founding member $25 promo pricing expires';
COMMENT ON COLUMN users.stripe_subscription_schedule_id IS 'Stripe subscription schedule ID for founding member transitions';

-- Create a view for founding members on promo pricing
CREATE OR REPLACE VIEW founding_members_promo AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  subscription_plan,
  subscription_status,
  founding_member_promo_expires_at,
  stripe_customer_id,
  stripe_subscription_schedule_id,
  created_at
FROM users 
WHERE founding_member = TRUE 
AND subscription_type = 'founding_member_schedule'
AND founding_member_promo_expires_at > NOW();

-- Create a view for founding members who have transitioned to regular pricing
CREATE OR REPLACE VIEW founding_members_regular AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  subscription_plan,
  subscription_status,
  founding_member_promo_expires_at,
  stripe_customer_id,
  stripe_subscription_id,
  created_at
FROM users 
WHERE founding_member = TRUE 
AND subscription_type = 'regular_monthly'
AND founding_member_promo_expires_at <= NOW();

-- ================================
-- SUBSCRIPTION TYPE REFERENCE
-- ================================
-- regular_monthly: Standard monthly billing ($75/month)
-- founding_member_schedule: Founding member on $25 promo for 3 months
-- annual: Annual billing with discount
-- lifetime: One-time payment for lifetime access

-- ================================
-- FOUNDING MEMBER SUBSCRIPTION FLOW
-- ================================
-- 1. User signs up as founding member
-- 2. subscription_type = 'founding_member_schedule'
-- 3. founding_member_promo_expires_at = created_at + 3 months
-- 4. After 3 months, webhook transitions to 'regular_monthly'
-- 5. founding_member = TRUE for life (special benefits) 