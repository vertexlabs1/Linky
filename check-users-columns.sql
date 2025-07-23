-- CHECK USERS TABLE COLUMNS
-- Simple query to see what columns are in the users table

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position; 