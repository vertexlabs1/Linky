-- COMPREHENSIVE DATABASE AUDIT FOR ADMIN LOGIN ISSUES
-- Run each section step by step and report results

-- 1. CHECK ALL TABLES EXIST
SELECT 'STEP 1: TABLE EXISTENCE CHECK' as audit_step;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. CHECK USERS TABLE STRUCTURE
SELECT 'STEP 2: USERS TABLE STRUCTURE' as audit_step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. CHECK USERS TABLE DATA
SELECT 'STEP 3: USERS TABLE DATA' as audit_step;
SELECT 
  id,
  email,
  first_name,
  last_name,
  auth_user_id,
  is_admin,
  founding_member,
  subscription_plan,
  subscription_status,
  status,
  created_at
FROM users
ORDER BY created_at;

-- 4. CHECK ROLES TABLE
SELECT 'STEP 4: ROLES TABLE' as audit_step;
SELECT * FROM roles ORDER BY name;

-- 5. CHECK USER_ROLES TABLE
SELECT 'STEP 5: USER_ROLES TABLE' as audit_step;
SELECT 
  ur.id,
  u.email,
  r.name as role_name,
  ur.active,
  ur.granted_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
ORDER BY ur.granted_at;

-- 6. CHECK RLS POLICIES ON USERS TABLE
SELECT 'STEP 6: RLS POLICIES' as audit_step;
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
WHERE tablename = 'users';

-- 7. CHECK IF RLS IS ENABLED
SELECT 'STEP 7: RLS STATUS' as audit_step;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 8. CHECK AUTH.USERS TABLE
SELECT 'STEP 8: AUTH USERS' as audit_step;
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users
WHERE email = 'tyler@vxlabs.co';

-- 9. CHECK FUNCTIONS AND TRIGGERS
SELECT 'STEP 9: FUNCTIONS' as audit_step;
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- 10. CHECK TRIGGERS
SELECT 'STEP 10: TRIGGERS' as audit_step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
OR event_object_table = 'users'
ORDER BY trigger_name;

-- 11. TEST BASIC SELECT WITHOUT RLS
SELECT 'STEP 11: DISABLE RLS TEST' as audit_step;
-- First disable RLS temporarily to test basic access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test basic select
SELECT 
  'Basic select test' as test_type,
  COUNT(*) as user_count,
  COUNT(CASE WHEN email = 'tyler@vxlabs.co' THEN 1 END) as tyler_count
FROM users;

-- 12. TEST TYLER'S COMPLETE PROFILE
SELECT 'STEP 12: TYLER COMPLETE PROFILE' as audit_step;
SELECT 
  u.*,
  au.email as auth_email,
  au.email_confirmed_at,
  ur.active as has_role,
  r.name as role_name
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co';

-- Re-enable RLS for now
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 