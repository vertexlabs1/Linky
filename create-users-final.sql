-- FINAL SCRIPT TO CREATE USERS WITH ALL CORRECT COLUMNS
-- Run this AFTER running the fix-missing-columns.sql script

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

-- 3. Grant admin role to Tyler
INSERT INTO user_roles (user_id, role_id, granted_by, active)
SELECT 
  u.id,
  r.id,
  u.id,
  true
FROM users u, roles r
WHERE u.email = 'tyler@vxlabs.co' 
  AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 4. Verify both users were created
SELECT 
  id,
  email,
  first_name,
  last_name,
  status,
  subscription_status,
  subscription_plan,
  subscription_type,
  is_admin,
  founding_member,
  stripe_customer_id,
  password_set,
  email_verified,
  created_at
FROM users 
WHERE email IN ('tyler@vxlabs.co', 'luke@lukepauldine.com')
ORDER BY created_at;

-- 5. Verify Tyler has admin role
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  r.name as role_name,
  ur.active as role_active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co'; 