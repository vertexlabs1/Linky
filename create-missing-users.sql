-- Create missing users after database reset
-- This script creates both Tyler's admin account and Luke's user account

-- 1. Create Tyler's admin user account
INSERT INTO users (
  email,
  first_name,
  last_name,
  status,
  subscription_status,
  subscription_plan,
  subscription_type,
  is_admin,
  founding_member,
  password_set,
  email_verified,
  created_at,
  updated_at
) VALUES (
  'tyler@vxlabs.co',
  'Tyler',
  'Admin',
  'active',
  'active',
  'founding_member',
  'founding_member_schedule',
  true,
  true,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. Create Luke's user account
INSERT INTO users (
  email,
  first_name,
  last_name,
  stripe_customer_id,
  status,
  subscription_status,
  subscription_plan,
  subscription_type,
  founding_member,
  created_at,
  updated_at
) VALUES (
  'luke@lukepauldine.com',
  'Luke',
  'Pauldine',
  'cus_SjDmwlB7CAwF4R',
  'active',
  'active',
  'founding_member',
  'founding_member_schedule',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. Verify both users were created
SELECT 
  id,
  email,
  first_name,
  last_name,
  status,
  subscription_status,
  subscription_plan,
  is_admin,
  founding_member,
  stripe_customer_id,
  created_at
FROM users 
WHERE email IN ('tyler@vxlabs.co', 'luke@lukepauldine.com')
ORDER BY created_at; 