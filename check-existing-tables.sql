-- CHECK EXISTING TABLES
-- Simple query to see what tables we currently have

SELECT 
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 