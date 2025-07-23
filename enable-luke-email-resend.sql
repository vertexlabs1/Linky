-- ENABLE WELCOME EMAIL RESEND FOR LUKE
-- This makes the resend button available in the admin panel

UPDATE users 
SET 
  email_verified = false,  -- This enables the resend button
  status = 'active',
  updated_at = NOW()
WHERE email ILIKE '%luke%paul%' 
   OR email ILIKE '%paul%dine%'
   OR first_name ILIKE '%luke%';

-- Verify the change
SELECT 
  email,
  email_verified,
  status,
  'Resend should be available: ' || CASE WHEN email_verified = false THEN 'YES' ELSE 'NO' END as resend_status
FROM users 
WHERE email ILIKE '%luke%paul%' 
   OR email ILIKE '%paul%dine%'
   OR first_name ILIKE '%luke%'; 