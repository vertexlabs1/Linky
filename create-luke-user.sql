-- Create Luke Pauldine's user record
-- Based on Stripe data: luke@lukepauldine.com, Customer ID: cus_SjDmwlB7CAwF4R

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

-- Verify the user was created
SELECT 
  id,
  email,
  first_name,
  last_name,
  stripe_customer_id,
  status,
  subscription_status,
  subscription_plan,
  founding_member,
  created_at
FROM users 
WHERE email = 'luke@lukepauldine.com'; 