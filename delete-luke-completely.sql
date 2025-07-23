-- COMPLETELY DELETE LUKE'S USER RECORD
-- This allows him to sign up fresh with a clean slate

-- First, show what we're about to delete
SELECT 'LUKE RECORDS TO DELETE:' as action;
SELECT 
  id,
  email,
  first_name,
  last_name,
  stripe_customer_id,
  stripe_subscription_id,
  created_at
FROM users 
WHERE email ILIKE '%luke%' 
   OR first_name ILIKE '%luke%' 
   OR last_name ILIKE '%paul%' 
   OR last_name ILIKE '%dine%';

-- Delete any related records first (if they exist)
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email ILIKE '%luke%' 
     OR first_name ILIKE '%luke%' 
     OR last_name ILIKE '%paul%' 
     OR last_name ILIKE '%dine%'
);

DELETE FROM transactions 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email ILIKE '%luke%' 
     OR first_name ILIKE '%luke%' 
     OR last_name ILIKE '%paul%' 
     OR last_name ILIKE '%dine%'
);

DELETE FROM subscriptions 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email ILIKE '%luke%' 
     OR first_name ILIKE '%luke%' 
     OR last_name ILIKE '%paul%' 
     OR last_name ILIKE '%dine%'
);

-- Delete the main user record
DELETE FROM users 
WHERE email ILIKE '%luke%' 
   OR first_name ILIKE '%luke%' 
   OR last_name ILIKE '%paul%' 
   OR last_name ILIKE '%dine%';

-- Verify deletion
SELECT 'VERIFICATION - Luke should be gone:' as verification;
SELECT COUNT(*) as luke_records_remaining
FROM users 
WHERE email ILIKE '%luke%' 
   OR first_name ILIKE '%luke%' 
   OR last_name ILIKE '%paul%' 
   OR last_name ILIKE '%dine%';

SELECT 'NEXT STEPS:' as instructions;
SELECT 
  '1. Process refund in Stripe for Luke' as step1,
  '2. Cancel his subscription in Stripe' as step2,
  '3. Luke can now sign up fresh' as step3,
  '4. New signup will go through proper webhook flow' as step4; 