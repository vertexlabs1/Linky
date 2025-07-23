-- Fix User Status Logic
-- This script updates the user status based on payment and password setup

-- First, let's see the current state
SELECT 
    email,
    first_name,
    last_name,
    status,
    password_set,
    founding_member,
    stripe_customer_id,
    subscription_plan,
    created_at
FROM users 
WHERE email IN ('tyleramos2025@gmail.com', 'tyleramos2019@gmail.com')
ORDER BY created_at DESC;

-- Update status logic:
-- 1. If user has paid (stripe_customer_id exists) but hasn't set password -> status = 'paid'
-- 2. If user has paid and has set password -> status = 'active'
-- 3. If user is founding member but hasn't paid -> status = 'pending'

-- Update tyleramos2025@gmail.com (should be 'paid' since they paid but may not have set password)
UPDATE users 
SET status = CASE 
    WHEN stripe_customer_id IS NOT NULL AND password_set = false THEN 'paid'
    WHEN stripe_customer_id IS NOT NULL AND password_set = true THEN 'active'
    WHEN founding_member = true AND stripe_customer_id IS NULL THEN 'pending'
    ELSE status
END,
updated_at = NOW()
WHERE email = 'tyleramos2025@gmail.com';

-- Update tyleramos2019@gmail.com (should be 'pending' if they haven't paid yet)
UPDATE users 
SET status = CASE 
    WHEN stripe_customer_id IS NOT NULL AND password_set = false THEN 'paid'
    WHEN stripe_customer_id IS NOT NULL AND password_set = true THEN 'active'
    WHEN founding_member = true AND stripe_customer_id IS NULL THEN 'pending'
    ELSE status
END,
updated_at = NOW()
WHERE email = 'tyleramos2019@gmail.com';

-- Show the updated state
SELECT 
    email,
    first_name,
    last_name,
    status,
    password_set,
    founding_member,
    stripe_customer_id,
    subscription_plan,
    created_at,
    updated_at
FROM users 
WHERE email IN ('tyleramos2025@gmail.com', 'tyleramos2019@gmail.com')
ORDER BY created_at DESC; 