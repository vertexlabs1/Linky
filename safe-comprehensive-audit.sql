-- SAFE COMPREHENSIVE SYSTEM AUDIT - HANDLES MISSING COMPONENTS
-- This version checks for existence before querying to avoid errors

-- =============================================================================
-- SECTION 1: BASIC DATABASE STRUCTURE
-- =============================================================================

SELECT '==== SECTION 1: BASIC DATABASE STRUCTURE ====' as audit_section;

-- 1.1: All Tables in Public Schema
SELECT 'STEP 1.1: ALL TABLES' as step;
SELECT 
  table_name,
  table_type,
  'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 1.2: Users Table Structure (CRITICAL)
SELECT 'STEP 1.2: USERS TABLE STRUCTURE' as step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1.3: Critical Table Existence Check
SELECT 'STEP 1.3: CRITICAL TABLE EXISTENCE' as step;
SELECT 
  'users' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'user_roles' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') 
    THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'roles' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') 
    THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'email_templates' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates' AND table_schema = 'public') 
    THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'transactions' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') 
    THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'webhook_deliveries' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_deliveries' AND table_schema = 'public') 
    THEN 'EXISTS' ELSE 'MISSING' END as status;

-- =============================================================================
-- SECTION 2: USER DATA INTEGRITY
-- =============================================================================

SELECT '==== SECTION 2: USER DATA INTEGRITY ====' as audit_section;

-- 2.1: User Data Summary
SELECT 'STEP 2.1: USER DATA SUMMARY' as step;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as users_with_auth,
  COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as users_without_auth,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users,
  COUNT(CASE WHEN founding_member = true THEN 1 END) as founding_members
FROM users;

-- 2.2: All User Records Detail
SELECT 'STEP 2.2: ALL USER RECORDS DETAIL' as step;
SELECT 
  email,
  first_name,
  last_name,
  is_admin,
  founding_member,
  auth_user_id,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_plan,
  subscription_status,
  status,
  email_verified,
  created_at
FROM users
ORDER BY created_at;

-- =============================================================================
-- SECTION 3: AUTH SYSTEM CHECK
-- =============================================================================

SELECT '==== SECTION 3: AUTH SYSTEM CHECK ====' as audit_section;

-- 3.1: Auth Users
SELECT 'STEP 3.1: AUTH USERS' as step;
SELECT 
  id as auth_user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at;

-- 3.2: Auth vs Database User Linkage
SELECT 'STEP 3.2: AUTH VS DATABASE USER LINKAGE' as step;
SELECT 
  au.email as auth_email,
  u.email as db_email,
  au.id as auth_id,
  u.auth_user_id as linked_auth_id,
  CASE 
    WHEN u.id IS NULL THEN 'AUTH USER WITHOUT DB RECORD'
    WHEN u.auth_user_id != au.id THEN 'MISMATCHED IDs'
    WHEN u.auth_user_id IS NULL THEN 'DB USER WITHOUT AUTH LINK'
    ELSE 'PROPERLY LINKED'
  END as link_status
FROM auth.users au
FULL OUTER JOIN users u ON au.id = u.auth_user_id
ORDER BY au.email;

-- =============================================================================
-- SECTION 4: ROLE SYSTEM CHECK
-- =============================================================================

SELECT '==== SECTION 4: ROLE SYSTEM CHECK ====' as audit_section;

-- 4.1: Roles Table Data (if exists)
SELECT 'STEP 4.1: ROLES TABLE DATA' as step;
SELECT * FROM roles ORDER BY name;

-- 4.2: User Roles Data (if exists)
SELECT 'STEP 4.2: USER ROLES DATA' as step;
SELECT 
  ur.*,
  u.email,
  r.name as role_name
FROM user_roles ur
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY ur.created_at;

-- =============================================================================
-- SECTION 5: SECURITY AUDIT
-- =============================================================================

SELECT '==== SECTION 5: SECURITY AUDIT ====' as audit_section;

-- 5.1: RLS Status
SELECT 'STEP 5.1: RLS STATUS' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN 'SECURED' ELSE 'OPEN - SECURITY RISK!' END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5.2: RLS Policies
SELECT 'STEP 5.2: RLS POLICIES' as step;
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- SECTION 6: TRIGGERS AND FUNCTIONS
-- =============================================================================

SELECT '==== SECTION 6: TRIGGERS AND FUNCTIONS ====' as audit_section;

-- 6.1: Triggers
SELECT 'STEP 6.1: TRIGGERS' as step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- 6.2: Functions
SELECT 'STEP 6.2: FUNCTIONS' as step;
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =============================================================================
-- SECTION 7: CRITICAL MISSING COMPONENTS
-- =============================================================================

SELECT '==== SECTION 7: CRITICAL MISSING COMPONENTS ====' as audit_section;

-- 7.1: Expected vs Actual Tables
SELECT 'STEP 7.1: EXPECTED VS ACTUAL TABLES' as step;
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'users', 'user_roles', 'roles', 'email_templates', 'features',
    'transactions', 'webhook_deliveries', 'subscription_events',
    'email_subscribers', 'promotions', 'user_promotions', 'payment_methods',
    'billing_changes', 'admin_actions', 'sync_health', 'plan_changes',
    'refunds', 'promo_applications', 'promo_usage_history'
  ]) as expected_table
),
actual_tables AS (
  SELECT table_name as actual_table
  FROM information_schema.tables 
  WHERE table_schema = 'public'
)
SELECT 
  COALESCE(e.expected_table, a.actual_table) as table_name,
  CASE 
    WHEN e.expected_table IS NULL THEN 'UNEXPECTED TABLE'
    WHEN a.actual_table IS NULL THEN 'MISSING TABLE - CRITICAL!'
    ELSE 'EXISTS'
  END as status
FROM expected_tables e
FULL OUTER JOIN actual_tables a ON e.expected_table = a.actual_table
ORDER BY 
  CASE WHEN a.actual_table IS NULL THEN 0 ELSE 1 END,
  table_name;

-- =============================================================================
-- SECTION 8: ADMIN FUNCTIONALITY TEST
-- =============================================================================

SELECT '==== SECTION 8: ADMIN FUNCTIONALITY TEST ====' as audit_section;

-- 8.1: Tyler's Complete Admin Profile
SELECT 'STEP 8.1: TYLER ADMIN PROFILE' as step;
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.is_admin,
  u.auth_user_id,
  u.status,
  COUNT(ur.id) as active_roles,
  STRING_AGG(r.name, ', ') as role_names
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co'
GROUP BY u.id, u.email, u.first_name, u.last_name, u.is_admin, u.auth_user_id, u.status;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

SELECT '==== FINAL SUMMARY ====' as audit_section;
SELECT 'AUDIT COMPLETE - FOCUS ON MISSING TABLES AND SECURITY ISSUES' as summary; 