-- CHECK FUNCTIONS ONLY
-- Simple query to see if critical functions exist

SELECT 
  'update_updated_at_column' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_updated_at_column' AND routine_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

SELECT 
  'handle_new_auth_user' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_auth_user' AND routine_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status; 