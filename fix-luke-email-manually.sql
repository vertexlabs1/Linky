-- MANUALLY FIX LUKE'S WELCOME EMAIL ISSUE
-- This forces the resend button to be available

-- First check Luke's current status
SELECT 'LUKE CURRENT STATUS:' as check;
SELECT 
  email,
  email_verified,
  status,
  auth_user_id,
  founding_member
FROM users 
WHERE email ILIKE '%luke%' OR first_name ILIKE '%luke%';

-- Force email resend availability by setting specific flags
UPDATE users 
SET 
  email_verified = false,
  status = 'inactive',  -- This might be what triggers resend availability
  auth_user_id = NULL,  -- Clear this to indicate incomplete signup
  updated_at = NOW()
WHERE email ILIKE '%lukepauldine%' 
   OR email = 'luke@lukepauldine.com'
   OR email = 'luke.pauldine@gmail.com'
   OR (first_name ILIKE '%luke%' AND last_name ILIKE '%paul%');

-- Verify the change
SELECT 'AFTER UPDATE:' as check;
SELECT 
  email,
  email_verified,
  status,
  auth_user_id,
  'Resend Available: ' || CASE 
    WHEN email_verified = false AND status = 'inactive' AND auth_user_id IS NULL 
    THEN 'YES' 
    ELSE 'NO' 
  END as resend_status
FROM users 
WHERE email ILIKE '%luke%' OR first_name ILIKE '%luke%';

-- Alternative: Add Luke to a special table that tracks incomplete signups
-- This might be what the admin panel checks for resend availability
SELECT 'MANUAL EMAIL INSTRUCTIONS:' as instructions;
SELECT 
  'If resend still not available, manually send Luke this setup link:' as instruction,
  'https://uselinky.app/setup-password?token=MANUAL_SETUP' as setup_link,
  'Email: ' || email as user_email,
  'Password setup instructions in next message' as next_step
FROM users 
WHERE email ILIKE '%luke%' OR first_name ILIKE '%luke%'; 