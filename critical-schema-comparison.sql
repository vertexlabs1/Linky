-- CRITICAL SCHEMA COMPARISON - Check what's missing vs what frontend expects
-- This will reveal what we failed to restore properly

-- 1. Check auth.users table structure
SELECT '=== AUTH.USERS TABLE STRUCTURE ===' as check_section;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if we can access auth.users at all
SELECT '=== AUTH.USERS ACCESS TEST ===' as check_section;
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- 3. Check users table structure vs frontend expectations
SELECT '=== USERS TABLE STRUCTURE ===' as check_section;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Check what columns the frontend is looking for that might be missing
SELECT '=== MISSING COLUMNS CHECK ===' as check_section;
SELECT 
  'company' as expected_column,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'company'
  ) THEN 'EXISTS' ELSE 'MISSING - FRONTEND WILL BREAK' END as status
UNION ALL
SELECT 
  'job_title' as expected_column,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'job_title'
  ) THEN 'EXISTS' ELSE 'MISSING - FRONTEND WILL BREAK' END as status
UNION ALL
SELECT 
  'phone' as expected_column,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN 'EXISTS' ELSE 'MISSING - FRONTEND WILL BREAK' END as status
UNION ALL
SELECT 
  'subscription_type' as expected_column,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_type'
  ) THEN 'EXISTS' ELSE 'MISSING - FRONTEND WILL BREAK' END as status;

-- 5. Check all schemas to see what we lost
SELECT '=== ALL SCHEMAS AVAILABLE ===' as check_section;
SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;

-- 6. Critical assessment
SELECT '=== CRITICAL ASSESSMENT ===' as check_section;
SELECT 
  'MAJOR PROBLEM: Database reset wiped production schema' as issue,
  'We only restored partial structure from limited migration files' as cause,
  'Frontend expects columns/features that no longer exist' as impact,
  'Need to rebuild schema from production backup or reverse engineer' as solution; 