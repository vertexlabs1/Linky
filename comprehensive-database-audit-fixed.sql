-- COMPREHENSIVE DATABASE AUDIT FOR ADMIN LOGIN ISSUES - CORRECTED
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

-- 3. CHECK USER_ROLES TABLE STRUCTURE  
SELECT 'STEP 3: USER_ROLES TABLE STRUCTURE' as audit_step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. CHECK ROLES TABLE STRUCTURE
SELECT 'STEP 4: ROLES TABLE STRUCTURE' as audit_step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. CHECK USERS TABLE DATA
SELECT 'STEP 5: USERS TABLE DATA' as audit_step;
-- Disable RLS temporarily to see data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

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

-- 6. CHECK ROLES TABLE DATA
SELECT 'STEP 6: ROLES TABLE DATA' as audit_step;
SELECT * FROM roles ORDER BY name;

-- 7. CHECK USER_ROLES TABLE DATA (with safe column selection)
SELECT 'STEP 7: USER_ROLES TABLE DATA' as audit_step;
SELECT 
  ur.id,
  ur.user_id,
  ur.role_id,
  ur.active,
  u.email,
  r.name as role_name
FROM user_roles ur
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY ur.id;

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

-- 9. CHECK RLS POLICIES ON USERS TABLE
SELECT 'STEP 9: RLS POLICIES' as audit_step;
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

-- 10. CHECK IF RLS IS ENABLED
SELECT 'STEP 10: RLS STATUS' as audit_step;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 11. TEST TYLER'S COMPLETE PROFILE
SELECT 'STEP 11: TYLER COMPLETE PROFILE' as audit_step;
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.auth_user_id,
  u.is_admin,
  u.founding_member,
  u.status,
  au.email as auth_email,
  au.email_confirmed_at,
  ur.active as has_active_role,
  r.name as role_name
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co';

-- 12. CHECK FUNCTIONS AND TRIGGERS
SELECT 'STEP 12: FUNCTIONS' as audit_step;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- 13. CHECK TRIGGERS
SELECT 'STEP 13: TRIGGERS' as audit_step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
OR event_object_table = 'users'
ORDER BY trigger_name;

-- Keep RLS disabled for now until we fix the issues
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY; 