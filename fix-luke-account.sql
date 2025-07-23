-- FIX LUKE'S ACCOUNT STATUS
-- Run this in your Supabase SQL editor

-- STEP 1: Update Luke's status to active
UPDATE users 
SET 
    status = 'active',
    subscription_status = 'active',
    subscription_plan = 'Prospector',
    subscription_type = 'founding_member_schedule',
    updated_at = NOW()
WHERE email = 'luke@lukepauldine.com';

-- STEP 2: Verify the update
SELECT 
    id,
    email,
    first_name,
    last_name,
    status,
    subscription_status,
    subscription_plan,
    subscription_type,
    founding_member,
    stripe_customer_id,
    stripe_subscription_id,
    created_at,
    updated_at
FROM users 
WHERE email = 'luke@lukepauldine.com';

-- STEP 3: Check if Luke exists in auth.users (if not, we'll need to create him)
SELECT 
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'luke@lukepauldine.com'; 