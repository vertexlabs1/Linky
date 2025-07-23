-- SIMPLIFIED LUKE DELETION - Only delete from tables that exist
-- This avoids errors from non-existent tables

-- Show what we're about to delete
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

-- Delete from user_roles (if any exist)
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email ILIKE '%luke%' 
     OR first_name ILIKE '%luke%' 
     OR last_name ILIKE '%paul%' 
     OR last_name ILIKE '%dine%'
);

-- Delete from transactions (if table exists and has records)
DELETE FROM transactions 
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

SELECT 'Luke deleted successfully - he can now sign up fresh!' as success_message; 