-- CHECK LUKE'S EMAIL STATUS
-- Run this in your Supabase SQL editor

-- Check Luke's user record
SELECT 
    id,
    email,
    first_name,
    last_name,
    status,
    subscription_status,
    founding_member,
    stripe_customer_id,
    stripe_subscription_id,
    created_at,
    updated_at
FROM users 
WHERE email = 'luke@lukepauldine.com';

-- Check if there are any transactions for Luke
SELECT 
    id,
    user_id,
    stripe_payment_intent_id,
    amount,
    currency,
    status,
    created_at
FROM transactions 
WHERE user_id = (SELECT id FROM users WHERE email = 'luke@lukepauldine.com');

-- Check if Luke exists in auth.users
SELECT 
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'luke@lukepauldine.com';

-- Check if Luke is in email_subscribers
SELECT 
    id,
    email,
    created_at
FROM email_subscribers 
WHERE email = 'luke@lukepauldine.com'; 