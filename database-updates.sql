-- ================================
-- LINKY DATABASE STRUCTURE UPDATE
-- ================================
-- This script updates the users table to support the new subscription plan structure
-- with founding member status and proper plan tiers.

-- Step 1: Add founding_member column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member BOOLEAN DEFAULT FALSE;

-- Step 2: Update existing users with subscription_plan = 'founding_member' 
-- Set them as founding members and change their plan to 'Prospector'
UPDATE users 
SET 
  founding_member = TRUE,
  subscription_plan = 'Prospector'
WHERE subscription_plan = 'founding_member' OR subscription_plan ILIKE '%founding%';

-- Step 3: Add constraint to ensure valid subscription plans
ALTER TABLE users 
ADD CONSTRAINT valid_subscription_plans 
CHECK (subscription_plan IN ('Prospector', 'Networker', 'Rainmaker'));

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_founding_member ON users(founding_member);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);

-- Step 5: Add comments to document the columns
COMMENT ON COLUMN users.founding_member IS 'True for founding members who get special perks and pricing';
COMMENT ON COLUMN users.subscription_plan IS 'User subscription tier: Prospector (lowest), Networker (middle), Rainmaker (top)';

-- Step 6: Create a view for easy founding member queries
CREATE OR REPLACE VIEW founding_members AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  phone,
  subscription_plan,
  subscription_status,
  stripe_customer_id,
  stripe_subscription_id,
  email_verified,
  password_set,
  status,
  created_at,
  updated_at
FROM users 
WHERE founding_member = TRUE;

-- ================================
-- SUBSCRIPTION PLAN REFERENCE
-- ================================
-- 🥉 Prospector (Lowest Tier)
--    - All founding members start here
--    - Basic features
--    - Standard support
--
-- 🥈 Networker (Middle Tier)  
--    - Enhanced features
--    - Priority support
--    - Advanced analytics
--
-- 🥇 Rainmaker (Top Tier)
--    - All features unlocked
--    - Premium support
--    - Custom integrations
--    - White-label options

-- ================================
-- FOUNDING MEMBER BENEFITS
-- ================================
-- Founding members get special treatment regardless of plan:
-- - Lifetime founding member status
-- - Special pricing (grandfathered rates)
-- - Exclusive access to beta features
-- - Priority customer support
-- - Recognition in community
-- - Input on product roadmap 