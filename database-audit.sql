-- COMPREHENSIVE DATABASE AUDIT
-- This script checks all tables and columns to ensure complete restoration

-- 1. List all tables in the database
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schemaname, tablename;

-- 2. Check users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 3. Check all other tables structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name != 'users'
ORDER BY table_name, ordinal_position;

-- 4. Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Check constraints
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid::regclass::text LIKE 'public.%'
ORDER BY table_name, constraint_name;

-- 6. Check functions
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- 7. Check triggers
SELECT 
  trigger_name,
  event_object_table as table_name,
  event_manipulation as event,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY table_name, trigger_name;

-- 8. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 