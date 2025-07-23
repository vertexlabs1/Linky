-- VERIFY AUTH METADATA FIX
-- Check if the auth user metadata was updated correctly

SELECT 
  'AUTH METADATA CHECK:' as info,
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  updated_at
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- Also check if the metadata contains the expected values
SELECT 
  'METADATA CONTENT CHECK:' as info,
  CASE 
    WHEN raw_user_meta_data->>'first_name' = 'Tyler' THEN '✅ First name correct'
    ELSE '❌ First name wrong: ' || COALESCE(raw_user_meta_data->>'first_name', 'NULL')
  END as first_name_check,
  CASE 
    WHEN raw_user_meta_data->>'last_name' = 'Amos' THEN '✅ Last name correct'
    ELSE '❌ Last name wrong: ' || COALESCE(raw_user_meta_data->>'last_name', 'NULL')
  END as last_name_check,
  CASE 
    WHEN raw_app_meta_data->>'is_admin' = 'true' THEN '✅ Admin flag correct'
    ELSE '❌ Admin flag wrong: ' || COALESCE(raw_app_meta_data->>'is_admin', 'NULL')
  END as admin_check
FROM auth.users 
WHERE email = 'tyler@vxlabs.co'; 