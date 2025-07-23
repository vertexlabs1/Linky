-- Manual fix for missing users
-- Run this in your Supabase SQL editor after getting the Stripe customer data

-- Step 1: Create a user record for the missing customer
-- Replace the values below with the actual data from Stripe

-- Example: If you have a customer with email 'luke@lukepauldine.com' in Stripe
-- but not in your database, run this:

/*
INSERT INTO users (
  email,
  first_name,
  last_name,
  phone,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_session_id,
  stripe_subscription_schedule_id,
  status,
  subscription_status,
  subscription_plan,
  subscription_type,
  founding_member,
  created_at,
  updated_at
) VALUES (
  'luke@lukepauldine.com', -- Replace with actual email
  'Luke', -- Replace with actual first name
  'Pauldine', -- Replace with actual last name
  NULL, -- Replace with actual phone if available
  'cus_SjDmwlB7CAwF4R', -- Replace with actual Stripe customer ID
  'sub_1RmLepK06flw6v4h58pajuqN', -- Replace with actual subscription ID
  'cs_test_...', -- Replace with actual session ID
  'sub_sched_...', -- Replace with actual schedule ID if founding member
  'active', -- Set to 'active' since they paid
  'active', -- Set to 'active' since they paid
  'Prospector', -- Set appropriate plan
  'founding_member_schedule', -- Set to 'regular' or 'founding_member_schedule'
  true, -- Set to true if founding member, false otherwise
  NOW(), -- Set to appropriate creation time
  NOW()
);
*/

-- Step 2: Update existing user with Stripe data (if user exists but not linked)
/*
UPDATE users 
SET 
  stripe_customer_id = 'cus_SjDmwlB7CAwF4R', -- Replace with actual customer ID
  stripe_subscription_id = 'sub_1RmLepK06flw6v4h58pajuqN', -- Replace with actual subscription ID
  stripe_session_id = 'cs_test_...', -- Replace with actual session ID
  stripe_subscription_schedule_id = 'sub_sched_...', -- Replace with actual schedule ID
  status = 'active',
  subscription_status = 'active',
  subscription_plan = 'Prospector',
  subscription_type = 'founding_member_schedule',
  founding_member = true,
  updated_at = NOW()
WHERE email = 'luke@lukepauldine.com'; -- Replace with actual email
*/

-- Step 3: Send welcome email manually (if needed)
-- You can use the admin dashboard to resend welcome emails

-- Step 4: Verify the fix
/*
SELECT 
  id,
  email,
  first_name,
  last_name,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  subscription_status,
  subscription_plan,
  founding_member,
  created_at
FROM users 
WHERE email = 'luke@lukepauldine.com'; -- Replace with actual email
*/ 