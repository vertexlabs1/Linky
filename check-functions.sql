-- CHECK CRITICAL FUNCTIONS
-- See if the functions from the restoration plan already exist

-- Check for update_updated_at_column function
SELECT 
  'FUNCTIONS CHECK:' as info,
  'update_updated_at_column' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_updated_at_column' AND routine_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

-- Check for handle_new_auth_user function
SELECT 
  'FUNCTIONS CHECK:' as info,
  'handle_new_auth_user' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_auth_user' AND routine_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

-- Check for triggers
SELECT 
  'TRIGGERS CHECK:' as info,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name; 