-- CHECK MISSING FUNCTION
-- See if update_updated_at_column function exists

SELECT 
  'update_updated_at_column' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_updated_at_column' AND routine_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status; 