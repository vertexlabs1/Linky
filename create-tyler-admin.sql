-- Create Tyler's admin user account
-- Email: tyler@vxlabs.co

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

-- Verify the admin user was created
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
  created_at
FROM users 
WHERE email = 'tyler@vxlabs.co'; 