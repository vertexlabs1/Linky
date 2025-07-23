-- ULTIMATE SAFE COMPREHENSIVE AUDIT - MAXIMUM THOROUGHNESS
-- This script checks EVERYTHING and handles all possible missing components gracefully

-- =============================================================================
-- SECTION 1: ENVIRONMENT AND BASIC INFO
-- =============================================================================

SELECT '==== SECTION 1: ENVIRONMENT AND BASIC INFO ====' as audit_section;

-- 1.1: Database Version and Basic Info
SELECT 'STEP 1.1: DATABASE VERSION AND BASIC INFO' as step;
SELECT 
  version() as postgres_version,
  current_database() as database_name,
  current_schema() as current_schema,
  NOW() as audit_timestamp;

-- 1.2: All Schemas
SELECT 'STEP 1.2: ALL SCHEMAS' as step;
SELECT 
  schema_name,
  'Schema exists' as status
FROM information_schema.schemata
ORDER BY schema_name;

-- 1.3: All Extensions
SELECT 'STEP 1.3: EXTENSIONS' as step;
SELECT 
  extname as extension_name,
  extversion as version,
  'Extension installed' as status
FROM pg_extension
ORDER BY extname;

-- =============================================================================
-- SECTION 2: COMPLETE TABLE INVENTORY
-- =============================================================================

SELECT '==== SECTION 2: COMPLETE TABLE INVENTORY ====' as audit_section;

-- 2.1: All Tables in ALL Schemas
SELECT 'STEP 2.1: ALL TABLES IN ALL SCHEMAS' as step;
SELECT 
  table_schema,
  table_name,
  table_type,
  CASE 
    WHEN table_schema = 'public' THEN 'MAIN APP TABLE'
    WHEN table_schema = 'auth' THEN 'AUTH SYSTEM TABLE'
    WHEN table_schema = 'storage' THEN 'STORAGE TABLE'
    ELSE 'OTHER SYSTEM TABLE'
  END as table_category
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth', 'storage', 'information_schema', 'pg_catalog')
ORDER BY table_schema, table_name;

-- 2.2: Public Schema Tables Only
SELECT 'STEP 2.2: PUBLIC SCHEMA TABLES ONLY' as step;
SELECT 
  table_name,
  table_type,
  'Public table' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2.3: Expected vs Actual Tables (COMPREHENSIVE)
SELECT 'STEP 2.3: EXPECTED VS ACTUAL TABLES' as step;
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'users', 'user_roles', 'roles', 'email_templates', 'features',
    'transactions', 'webhook_deliveries', 'subscription_events',
    'email_subscribers', 'promotions', 'user_promotions', 'payment_methods',
    'billing_changes', 'admin_actions', 'sync_health', 'plan_changes',
    'refunds', 'promo_applications', 'promo_usage_history',
    'subscriptions', 'invoices', 'customers', 'products', 'prices',
    'coupons', 'discounts', 'audit_logs', 'system_settings',
    'email_logs', 'notification_logs', 'api_keys', 'sessions'
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
    WHEN a.actual_table IS NULL THEN 'MISSING TABLE - NEEDS RESTORATION!'
    ELSE 'EXISTS'
  END as status,
  CASE 
    WHEN e.expected_table IN ('users', 'user_roles', 'roles') THEN 'CRITICAL - CORE AUTH'
    WHEN e.expected_table IN ('email_templates', 'webhook_deliveries') THEN 'CRITICAL - EMAIL/WEBHOOKS'
    WHEN e.expected_table IN ('transactions', 'subscriptions') THEN 'CRITICAL - BILLING'
    WHEN a.actual_table IS NULL THEN 'MISSING'
    ELSE 'NORMAL'
  END as priority
FROM expected_tables e
FULL OUTER JOIN actual_tables a ON e.expected_table = a.actual_table
ORDER BY 
  CASE WHEN a.actual_table IS NULL THEN 0 ELSE 1 END,
  CASE 
    WHEN e.expected_table IN ('users', 'user_roles', 'roles') THEN 1
    WHEN e.expected_table IN ('email_templates', 'webhook_deliveries') THEN 2
    ELSE 3
  END,
  table_name;

-- =============================================================================
-- SECTION 3: DETAILED TABLE STRUCTURES
-- =============================================================================

SELECT '==== SECTION 3: DETAILED TABLE STRUCTURES ====' as audit_section;

-- 3.1: Users Table Structure (CRITICAL)
SELECT 'STEP 3.1: USERS TABLE STRUCTURE' as step;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Users table exists - showing structure';
    ELSE
        RAISE NOTICE 'CRITICAL: Users table MISSING!';
    END IF;
END $$;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  ordinal_position,
  'Users table column' as table_ref
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3.2: User_Roles Table Structure
SELECT 'STEP 3.2: USER_ROLES TABLE STRUCTURE' as step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position,
  'User_roles table column' as table_ref
FROM information_schema.columns
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3.3: Roles Table Structure
SELECT 'STEP 3.3: ROLES TABLE STRUCTURE' as step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position,
  'Roles table column' as table_ref
FROM information_schema.columns
WHERE table_name = 'roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3.4: All Other Table Structures
SELECT 'STEP 3.4: ALL OTHER TABLE STRUCTURES' as step;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name NOT IN ('users', 'user_roles', 'roles')
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- SECTION 4: CONSTRAINTS, INDEXES, AND RELATIONSHIPS
-- =============================================================================

SELECT '==== SECTION 4: CONSTRAINTS, INDEXES, AND RELATIONSHIPS ====' as audit_section;

-- 4.1: All Constraints
SELECT 'STEP 4.1: ALL CONSTRAINTS' as step;
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  CASE tc.constraint_type
    WHEN 'PRIMARY KEY' THEN 'PRIMARY KEY CONSTRAINT'
    WHEN 'FOREIGN KEY' THEN 'FOREIGN KEY CONSTRAINT'
    WHEN 'UNIQUE' THEN 'UNIQUE CONSTRAINT'
    WHEN 'CHECK' THEN 'CHECK CONSTRAINT'
    ELSE 'OTHER CONSTRAINT'
  END as constraint_description
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- 4.2: Foreign Key Relationships
SELECT 'STEP 4.2: FOREIGN KEY RELATIONSHIPS' as step;
SELECT 
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  tc.constraint_name,
  'Foreign key relationship' as relationship_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4.3: All Indexes
SELECT 'STEP 4.3: ALL INDEXES' as step;
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef,
  'Database index' as index_type
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- SECTION 5: USER DATA AND AUTH INTEGRITY
-- =============================================================================

SELECT '==== SECTION 5: USER DATA AND AUTH INTEGRITY ====' as audit_section;

-- 5.1: User Data Summary (if users table exists)
SELECT 'STEP 5.1: USER DATA SUMMARY' as step;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Users table exists - showing data summary';
    ELSE
        RAISE NOTICE 'CRITICAL: Cannot show user data - users table missing!';
    END IF;
END $$;

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as users_with_auth,
  COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as users_without_auth,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users,
  COUNT(CASE WHEN founding_member = true THEN 1 END) as founding_members,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_emails,
  COUNT(CASE WHEN email_verified = false THEN 1 END) as unverified_emails,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users
FROM users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public');

-- 5.2: All User Records Detail (if users table exists)
SELECT 'STEP 5.2: ALL USER RECORDS DETAIL' as step;
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
  created_at,
  updated_at
FROM users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
ORDER BY created_at;

-- 5.3: Auth Users (Always exists in Supabase)
SELECT 'STEP 5.3: AUTH USERS' as step;
SELECT 
  id as auth_user_id,
  email,
  email_confirmed_at,
  phone,
  created_at,
  updated_at,
  'Auth system user' as user_type
FROM auth.users
ORDER BY created_at;

-- 5.4: Auth vs Database User Linkage
SELECT 'STEP 5.4: AUTH VS DATABASE USER LINKAGE' as step;
SELECT 
  au.email as auth_email,
  COALESCE(u.email, 'NO DB RECORD') as db_email,
  au.id as auth_id,
  COALESCE(u.auth_user_id::text, 'NULL') as linked_auth_id,
  au.email_confirmed_at,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
      THEN 'USERS TABLE MISSING!'
    WHEN u.id IS NULL THEN 'AUTH USER WITHOUT DB RECORD'
    WHEN u.auth_user_id != au.id THEN 'MISMATCHED IDs - BROKEN LINK!'
    WHEN u.auth_user_id IS NULL THEN 'DB USER WITHOUT AUTH LINK'
    ELSE 'PROPERLY LINKED'
  END as link_status,
  CASE 
    WHEN u.is_admin = true THEN 'ADMIN USER'
    WHEN u.founding_member = true THEN 'FOUNDING MEMBER'
    WHEN u.id IS NOT NULL THEN 'REGULAR USER'
    ELSE 'AUTH ONLY'
  END as user_category
FROM auth.users au
FULL OUTER JOIN users u ON au.id = u.auth_user_id 
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
ORDER BY au.email;

-- =============================================================================
-- SECTION 6: ROLE SYSTEM INTEGRITY
-- =============================================================================

SELECT '==== SECTION 6: ROLE SYSTEM INTEGRITY ====' as audit_section;

-- 6.1: Roles Table Data (if exists)
SELECT 'STEP 6.1: ROLES TABLE DATA' as step;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') THEN
        RAISE NOTICE 'Roles table exists - showing data';
    ELSE
        RAISE NOTICE 'WARNING: Roles table missing!';
    END IF;
END $$;

SELECT 
  id,
  name,
  description,
  permissions,
  created_at,
  updated_at,
  'Role definition' as record_type
FROM roles 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public')
ORDER BY name;

-- 6.2: User Roles Data (if exists)
SELECT 'STEP 6.2: USER ROLES DATA' as step;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        RAISE NOTICE 'User_roles table exists - showing data';
    ELSE
        RAISE NOTICE 'WARNING: User_roles table missing!';
    END IF;
END $$;

SELECT 
  ur.id,
  ur.user_id,
  ur.role_id,
  ur.active,
  ur.created_at,
  ur.updated_at,
  COALESCE(u.email, 'USER NOT FOUND') as user_email,
  COALESCE(r.name, 'ROLE NOT FOUND') as role_name,
  'User role assignment' as record_type
FROM user_roles ur
LEFT JOIN users u ON ur.user_id = u.id 
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
LEFT JOIN roles r ON ur.role_id = r.id
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public')
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public')
ORDER BY ur.created_at;

-- =============================================================================
-- SECTION 7: SECURITY AUDIT
-- =============================================================================

SELECT '==== SECTION 7: SECURITY AUDIT ====' as audit_section;

-- 7.1: RLS Status on All Tables
SELECT 'STEP 7.1: RLS STATUS ON ALL TABLES' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'SECURED ✓'
    WHEN tablename IN ('users', 'user_roles', 'roles') THEN 'OPEN - CRITICAL SECURITY RISK! ⚠️'
    ELSE 'OPEN - POTENTIAL SECURITY RISK ⚠️'
  END as security_status,
  CASE 
    WHEN tablename IN ('users', 'user_roles', 'roles') THEN 'CRITICAL'
    ELSE 'NORMAL'
  END as table_importance
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY 
  CASE WHEN tablename IN ('users', 'user_roles', 'roles') THEN 1 ELSE 2 END,
  tablename;

-- 7.2: RLS Policies Detail
SELECT 'STEP 7.2: RLS POLICIES DETAIL' as step;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check,
  'RLS Policy' as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- SECTION 8: FUNCTIONS, TRIGGERS, AND AUTOMATION
-- =============================================================================

SELECT '==== SECTION 8: FUNCTIONS, TRIGGERS, AND AUTOMATION ====' as audit_section;

-- 8.1: All Database Functions
SELECT 'STEP 8.1: ALL DATABASE FUNCTIONS' as step;
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition,
  'Custom function' as function_category
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 8.2: All Triggers
SELECT 'STEP 8.2: ALL TRIGGERS' as step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation,
  CASE 
    WHEN event_object_table = 'users' THEN 'CRITICAL - USER TRIGGER'
    ELSE 'NORMAL TRIGGER'
  END as trigger_importance
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
ORDER BY 
  CASE WHEN event_object_table = 'users' THEN 1 ELSE 2 END,
  event_object_table, 
  trigger_name;

-- =============================================================================
-- SECTION 9: EMAIL AND NOTIFICATION SYSTEM
-- =============================================================================

SELECT '==== SECTION 9: EMAIL AND NOTIFICATION SYSTEM ====' as audit_section;

-- 9.1: Email Templates (if table exists)
SELECT 'STEP 9.1: EMAIL TEMPLATES' as step;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates' AND table_schema = 'public') THEN
        RAISE NOTICE 'Email templates table exists';
    ELSE
        RAISE NOTICE 'WARNING: Email templates table missing - email system broken!';
    END IF;
END $$;

-- Try to query email_templates safely
SELECT 
  *,
  'Email template' as template_type
FROM email_templates
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates' AND table_schema = 'public')
ORDER BY created_at;

-- =============================================================================
-- SECTION 10: CRITICAL SYSTEM FUNCTIONALITY TESTS
-- =============================================================================

SELECT '==== SECTION 10: CRITICAL SYSTEM FUNCTIONALITY TESTS ====' as audit_section;

-- 10.1: Tyler's Complete Admin Profile Test
SELECT 'STEP 10.1: TYLER ADMIN PROFILE TEST' as step;
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.is_admin,
  u.auth_user_id,
  u.status,
  COUNT(ur.id) as active_roles,
  STRING_AGG(r.name, ', ') as role_names,
  CASE 
    WHEN u.is_admin = true AND COUNT(ur.id) > 0 THEN 'ADMIN ACCESS: FULL ✓'
    WHEN u.is_admin = true AND COUNT(ur.id) = 0 THEN 'ADMIN ACCESS: FLAG ONLY ⚠️'
    WHEN u.is_admin = false THEN 'ADMIN ACCESS: NONE ❌'
    ELSE 'ADMIN ACCESS: UNKNOWN ❓'
  END as admin_status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public')
LEFT JOIN roles r ON ur.role_id = r.id
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public')
WHERE u.email = 'tyler@vxlabs.co'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
GROUP BY u.id, u.email, u.first_name, u.last_name, u.is_admin, u.auth_user_id, u.status;

-- =============================================================================
-- SECTION 11: FINAL CRITICAL ASSESSMENT
-- =============================================================================

SELECT '==== SECTION 11: FINAL CRITICAL ASSESSMENT ====' as audit_section;

-- 11.1: Critical System Health Check
SELECT 'STEP 11.1: CRITICAL SYSTEM HEALTH CHECK' as step;
SELECT 
  'users' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN 'EXISTS ✓' 
    ELSE 'MISSING ❌ - SYSTEM BROKEN!' 
  END as status,
  'CRITICAL' as priority
UNION ALL
SELECT 
  'user_roles' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') 
    THEN 'EXISTS ✓' 
    ELSE 'MISSING ❌ - ROLES BROKEN!' 
  END as status,
  'CRITICAL' as priority
UNION ALL
SELECT 
  'roles' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') 
    THEN 'EXISTS ✓' 
    ELSE 'MISSING ❌ - ROLES BROKEN!' 
  END as status,
  'CRITICAL' as priority
UNION ALL
SELECT 
  'email_templates' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates' AND table_schema = 'public') 
    THEN 'EXISTS ✓' 
    ELSE 'MISSING ❌ - EMAIL BROKEN!' 
  END as status,
  'HIGH' as priority
UNION ALL
SELECT 
  'webhook_deliveries' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_deliveries' AND table_schema = 'public') 
    THEN 'EXISTS ✓' 
    ELSE 'MISSING ❌ - WEBHOOKS BROKEN!' 
  END as status,
  'HIGH' as priority;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

SELECT '==== FINAL SUMMARY ====' as audit_section;
SELECT 'ULTIMATE AUDIT COMPLETE - REVIEW ALL SECTIONS FOR MISSING COMPONENTS' as summary;
SELECT 'FOCUS ON: MISSING TABLES, SECURITY RISKS, BROKEN AUTH LINKAGE' as focus_areas;
SELECT 'NEXT: CREATE RESTORATION PLAN BASED ON AUDIT RESULTS' as next_steps; 