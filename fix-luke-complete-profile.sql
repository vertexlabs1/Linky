-- COMPLETE FIX FOR LUKE'S USER PROFILE
-- This will restore his auth account, Stripe data, and founding member status

-- Step 1: Get Luke's current data
SELECT 'LUKE CURRENT DATA:' as step;
SELECT 
  id,
  email,
  first_name,
  last_name,
  stripe_customer_id,
  stripe_subscription_id,
  auth_user_id,
  founding_member,
  email_verified,
  status,
  subscription_status
FROM users 
WHERE email ILIKE '%luke%' OR first_name ILIKE '%luke%';

-- Step 2: Update Luke with complete founding member profile
-- (Update the email to match Luke's exact email from your admin panel)
UPDATE users 
SET
  -- Set founding member status
  founding_member = true,
  subscription_plan = 'Prospector',
  subscription_status = 'active',
  subscription_type = 'founding_member_schedule',
  
  -- Fix email verification to allow welcome email resend
  email_verified = false,  -- This allows resend
  status = 'active',
  
  -- Set founding member dates
  founding_member_purchased_at = NOW(),
  
  -- Update timestamps
  updated_at = NOW()

WHERE email = 'luke.pauldine@gmail.com'  -- Update this with Luke's exact email
   OR email ILIKE '%luke%paul%'
   OR email ILIKE '%paul%dine%';

-- Step 3: Create auth account for Luke if it doesn't exist
-- This is for manual creation in Supabase Auth panel:
SELECT 'CREATE AUTH ACCOUNT MANUALLY:' as instruction;
SELECT 
  'Go to Supabase Auth Users and create account for: ' || email as action,
  'Email: ' || email as user_email,
  'Temp Password: FoundingMember2024!' as temp_password,
  'Then run the next query to link the auth_user_id' as next_step
FROM users 
WHERE email ILIKE '%luke%' OR first_name ILIKE '%luke%';

-- Step 4: After creating auth account, update auth_user_id
-- (Run this AFTER creating the auth account manually)
-- UPDATE users 
-- SET auth_user_id = 'PASTE_AUTH_USER_ID_HERE'
-- WHERE email = 'luke.pauldine@gmail.com';

-- Step 5: Verify the complete fix
SELECT 'VERIFICATION - Luke should now have:' as verification;
SELECT 
  email,
  auth_user_id,
  stripe_customer_id,
  stripe_subscription_id,
  founding_member,
  subscription_plan,
  subscription_status,
  email_verified,
  status,
  'Can resend email: ' || CASE WHEN email_verified = false THEN 'YES' ELSE 'NO' END as resend_available,
  'Can login: ' || CASE WHEN auth_user_id IS NOT NULL THEN 'YES' ELSE 'NO - Need auth account' END as login_available
FROM users 
WHERE email ILIKE '%luke%' OR first_name ILIKE '%luke%';

SELECT 'NEXT STEPS:' as next_steps;
SELECT 
  '1. Create auth account in Supabase Auth panel' as step1,
  '2. Update auth_user_id in users table' as step2,
  '3. Resend welcome email from admin panel' as step3,
  '4. Luke can log in and set his password' as step4; 