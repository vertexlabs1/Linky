-- Check for missing users and diagnose the issue
-- Run this in your Supabase SQL editor

-- 1. Check all users in the database
SELECT 
  id,
  email,
  first_name,
  last_name,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_session_id,
  status,
  subscription_status,
  subscription_plan,
  founding_member,
  created_at,
  updated_at
FROM users 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. Check for users without Stripe customer IDs (orphaned users)
SELECT 
  id,
  email,
  first_name,
  last_name,
  status,
  subscription_status,
  created_at
FROM users 
WHERE stripe_customer_id IS NULL
ORDER BY created_at DESC;

-- 3. Check for users with pending status (might be the missing user)
SELECT 
  id,
  email,
  first_name,
  last_name,
  stripe_customer_id,
  stripe_session_id,
  status,
  subscription_status,
  created_at
FROM users 
WHERE status = 'pending' OR subscription_status = 'inactive'
ORDER BY created_at DESC;

-- 4. Check for recent users (last 24 hours)
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
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. Check for users with specific email (replace with the actual email)
-- SELECT 
--   id,
--   email,
--   first_name,
--   last_name,
--   stripe_customer_id,
--   stripe_subscription_id,
--   status,
--   subscription_status,
--   created_at
-- FROM users 
-- WHERE email = 'user@example.com'; -- Replace with actual email

-- 6. Check webhook delivery tracking (if table exists)
-- SELECT 
--   stripe_event_id,
--   event_type,
--   delivery_status,
--   error_message,
--   created_at
-- FROM webhook_deliveries 
-- WHERE created_at >= NOW() - INTERVAL '24 hours'
-- ORDER BY created_at DESC;

-- 7. Check billing events (if table exists)
-- SELECT 
--   user_id,
--   event_type,
--   processed,
--   error_message,
--   created_at
-- FROM billing_events 
-- WHERE created_at >= NOW() - INTERVAL '24 hours'
-- ORDER BY created_at DESC; 