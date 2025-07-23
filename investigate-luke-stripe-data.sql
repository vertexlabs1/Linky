-- INVESTIGATE LUKE'S MISSING STRIPE DATA
-- This will show what data is missing and needs to be synced

-- Check Luke's current user record
SELECT 'LUKE USER RECORD:' as check;
SELECT 
  id,
  email,
  first_name,
  last_name,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_plan,
  subscription_status,
  founding_member,
  founding_member_purchased_at,
  current_plan_id,
  current_period_end,
  status,
  created_at
FROM users 
WHERE email ILIKE '%luke%' OR first_name ILIKE '%luke%' OR last_name ILIKE '%paul%' OR last_name ILIKE '%dine%';

-- Check if Luke has any subscription records
SELECT 'LUKE SUBSCRIPTION RECORDS:' as check;
SELECT * 
FROM subscriptions 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email ILIKE '%luke%' OR first_name ILIKE '%luke%' OR last_name ILIKE '%paul%' OR last_name ILIKE '%dine%'
);

-- Check webhook deliveries for Luke's customer ID
SELECT 'LUKE WEBHOOK HISTORY:' as check;
SELECT 
  event_type,
  processed,
  created_at,
  stripe_event_id,
  data ->> 'object' as object_type
FROM webhook_deliveries 
WHERE data ->> 'customer' LIKE '%cus_%'
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- Check for any Stripe events related to Luke
SELECT 'RECENT STRIPE EVENTS:' as check;
SELECT 
  event_type,
  stripe_customer_id,
  stripe_subscription_id,
  processed,
  created_at,
  error_message
FROM subscription_events 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10; 