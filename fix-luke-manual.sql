-- Manual fix for Luke Pauldine's missing user record
-- Based on Stripe data: luke@lukepauldine.com, Customer ID: cus_SjDmwlB7CAwF4R

-- First, check if user already exists
SELECT 
  id,
  email,
  first_name,
  last_name,
  stripe_customer_id,
  status,
  subscription_status,
  created_at
FROM users 
WHERE email = 'luke@lukepauldine.com';

-- If no user exists, create one
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
) 
SELECT 
  'luke@lukepauldine.com',
  'Luke',
  'Pauldine',
  'cus_SjDmwlB7CAwF4R',
  'active',
  'active',
  'Prospector',
  'founding_member_schedule',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'luke@lukepauldine.com'
);

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