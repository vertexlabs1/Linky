-- COMPREHENSIVE SYSTEM AUDIT - ABSOLUTELY EVERYTHING
-- This checks every table, column, function, trigger, policy, and data integrity
-- Run this entire script and provide ALL results

-- =============================================================================
-- SECTION 1: DATABASE STRUCTURE AUDIT
-- =============================================================================

SELECT '==== SECTION 1: DATABASE STRUCTURE AUDIT ====' as audit_section;

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
  character_maximum_length,
  ordinal_position
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1.3: User_Roles Table Structure
SELECT 'STEP 1.3: USER_ROLES TABLE STRUCTURE' as step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1.4: Roles Table Structure
SELECT 'STEP 1.4: ROLES TABLE STRUCTURE' as step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_name = 'roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1.5: All Other Table Structures
SELECT 'STEP 1.5: ALL OTHER TABLE STRUCTURES' as step;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name NOT IN ('users', 'user_roles', 'roles')
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- SECTION 2: TABLE CONSTRAINTS AND INDEXES
-- =============================================================================

SELECT '==== SECTION 2: CONSTRAINTS AND INDEXES ====' as audit_section;

-- 2.1: Primary Keys
SELECT 'STEP 2.1: PRIMARY KEYS' as step;
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 2.2: Foreign Keys
SELECT 'STEP 2.2: FOREIGN KEYS' as step;
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 2.3: Unique Constraints
SELECT 'STEP 2.3: UNIQUE CONSTRAINTS' as step;
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 2.4: Indexes
SELECT 'STEP 2.4: INDEXES' as step;
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- SECTION 3: FUNCTIONS, TRIGGERS, AND AUTOMATION
-- =============================================================================

SELECT '==== SECTION 3: FUNCTIONS, TRIGGERS, AND AUTOMATION ====' as audit_section;

-- 3.1: Database Functions
SELECT 'STEP 3.1: DATABASE FUNCTIONS' as step;
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 3.2: Triggers
SELECT 'STEP 3.2: TRIGGERS' as step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- 3.3: Trigger Functions Detail
SELECT 'STEP 3.3: TRIGGER FUNCTIONS DETAIL' as step;
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%trigger%' OR p.proname LIKE '%user%'
ORDER BY p.proname;

-- =============================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- =============================================================================

SELECT '==== SECTION 4: ROW LEVEL SECURITY ====' as audit_section;

-- 4.1: RLS Status
SELECT 'STEP 4.1: RLS STATUS' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN 'SECURED' ELSE 'OPEN - POTENTIAL SECURITY RISK!' END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4.2: RLS Policies
SELECT 'STEP 4.2: RLS POLICIES' as step;
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

-- =============================================================================
-- SECTION 5: CRITICAL DATA INTEGRITY
-- =============================================================================

SELECT '==== SECTION 5: CRITICAL DATA INTEGRITY ====' as audit_section;

-- 5.1: User Data Integrity
SELECT 'STEP 5.1: USER DATA INTEGRITY' as step;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as users_with_auth,
  COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as users_without_auth,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users,
  COUNT(CASE WHEN founding_member = true THEN 1 END) as founding_members,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_emails,
  COUNT(CASE WHEN email_verified = false THEN 1 END) as unverified_emails
FROM users;

-- 5.2: Admin Users Detail
SELECT 'STEP 5.2: ADMIN USERS DETAIL' as step;
SELECT 
  email,
  first_name,
  last_name,
  is_admin,
  auth_user_id,
  status,
  created_at,
  'Admin user check' as note
FROM users 
WHERE is_admin = true
ORDER BY created_at;

-- 5.3: User Roles Assignment
SELECT 'STEP 5.3: USER ROLES ASSIGNMENT' as step;
SELECT 
  u.email,
  r.name as role_name,
  ur.active,
  ur.created_at as role_granted_at,
  'Role assignment' as note
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.email, r.name;

-- 5.4: Orphaned Records Check
SELECT 'STEP 5.4: ORPHANED RECORDS CHECK' as step;

-- Check for user_roles without valid users
SELECT 
  'user_roles orphans' as check_type,
  COUNT(*) as orphaned_count
FROM user_roles ur
LEFT JOIN users u ON ur.user_id = u.id
WHERE u.id IS NULL

UNION ALL

-- Check for user_roles without valid roles
SELECT 
  'user_roles invalid roles' as check_type,
  COUNT(*) as orphaned_count
FROM user_roles ur
LEFT JOIN roles r ON ur.role_id = r.id
WHERE r.id IS NULL;

-- =============================================================================
-- SECTION 6: AUTH SYSTEM INTEGRITY
-- =============================================================================

SELECT '==== SECTION 6: AUTH SYSTEM INTEGRITY ====' as audit_section;

-- 6.1: Auth Users vs Database Users
SELECT 'STEP 6.1: AUTH USERS VS DATABASE USERS' as step;
SELECT 
  au.email as auth_email,
  u.email as db_email,
  au.email_confirmed_at,
  u.auth_user_id,
  u.status as db_status,
  CASE 
    WHEN u.id IS NULL THEN 'AUTH USER WITHOUT DB RECORD'
    WHEN u.auth_user_id != au.id THEN 'MISMATCHED IDs'
    ELSE 'PROPERLY LINKED'
  END as link_status
FROM auth.users au
FULL OUTER JOIN users u ON au.id = u.auth_user_id
ORDER BY au.email;

-- 6.2: Users Missing Auth Accounts
SELECT 'STEP 6.2: USERS MISSING AUTH ACCOUNTS' as step;
SELECT 
  email,
  first_name,
  last_name,
  auth_user_id,
  status,
  'Missing auth account' as issue
FROM users 
WHERE auth_user_id IS NULL
AND status != 'inactive'
ORDER BY created_at;

-- =============================================================================
-- SECTION 7: EMAIL SYSTEM VERIFICATION
-- =============================================================================

SELECT '==== SECTION 7: EMAIL SYSTEM VERIFICATION ====' as audit_section;

-- 7.1: Email Templates Check
SELECT 'STEP 7.1: EMAIL TEMPLATES CHECK' as step;
SELECT * FROM email_templates
ORDER BY template_name;

-- 7.2: Email Verification Status
SELECT 'STEP 7.2: EMAIL VERIFICATION STATUS' as step;
SELECT 
  email_verified,
  COUNT(*) as user_count,
  'Email verification distribution' as metric
FROM users
GROUP BY email_verified
ORDER BY email_verified;

-- 7.3: Users Who Should Receive Welcome Emails
SELECT 'STEP 7.3: USERS WHO SHOULD RECEIVE WELCOME EMAILS' as step;
SELECT 
  email,
  first_name,
  last_name,
  email_verified,
  auth_user_id,
  status,
  created_at,
  'Eligible for welcome email' as note
FROM users 
WHERE email_verified = false 
AND status = 'active'
ORDER BY created_at;

-- =============================================================================
-- SECTION 8: STRIPE INTEGRATION VERIFICATION
-- =============================================================================

SELECT '==== SECTION 8: STRIPE INTEGRATION VERIFICATION ====' as audit_section;

-- 8.1: Stripe Customer Data
SELECT 'STEP 8.1: STRIPE CUSTOMER DATA' as step;
SELECT 
  email,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_plan,
  subscription_status,
  founding_member,
  CASE 
    WHEN stripe_customer_id IS NULL THEN 'NO STRIPE CUSTOMER'
    WHEN stripe_subscription_id IS NULL THEN 'NO SUBSCRIPTION'
    ELSE 'HAS STRIPE DATA'
  END as stripe_status
FROM users
ORDER BY created_at;

-- 8.2: Founding Members Check
SELECT 'STEP 8.2: FOUNDING MEMBERS CHECK' as step;
SELECT 
  email,
  founding_member,
  founding_member_purchased_at,
  subscription_plan,
  subscription_status,
  stripe_customer_id,
  stripe_subscription_id
FROM users 
WHERE founding_member = true
ORDER BY founding_member_purchased_at;

-- =============================================================================
-- SECTION 9: WEBHOOK AND EVENT SYSTEM
-- =============================================================================

SELECT '==== SECTION 9: WEBHOOK AND EVENT SYSTEM ====' as audit_section;

-- 9.1: Recent Webhook Deliveries
SELECT 'STEP 9.1: RECENT WEBHOOK DELIVERIES' as step;
SELECT 
  event_type,
  processed,
  created_at,
  stripe_event_id,
  error_message
FROM webhook_deliveries 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- 9.2: Subscription Events
SELECT 'STEP 9.2: SUBSCRIPTION EVENTS' as step;
SELECT 
  event_type,
  stripe_customer_id,
  stripe_subscription_id,
  processed,
  created_at,
  error_message
FROM subscription_events 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- =============================================================================
-- SECTION 10: CRITICAL SYSTEM FUNCTIONALITY
-- =============================================================================

SELECT '==== SECTION 10: CRITICAL SYSTEM FUNCTIONALITY ====' as audit_section;

-- 10.1: Test Admin Role Check Function
SELECT 'STEP 10.1: ADMIN ROLE CHECK TEST' as step;
SELECT 
  u.email,
  u.is_admin,
  COUNT(ur.id) as role_count,
  STRING_AGG(r.name, ', ') as assigned_roles,
  'Admin function test' as test_type
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co'
GROUP BY u.id, u.email, u.is_admin;

-- 10.2: Password Reset Capability Check
SELECT 'STEP 10.2: PASSWORD RESET CAPABILITY' as step;
SELECT 
  email,
  auth_user_id,
  CASE 
    WHEN auth_user_id IS NOT NULL THEN 'CAN RESET PASSWORD'
    ELSE 'CANNOT RESET - NO AUTH ACCOUNT'
  END as reset_capability
FROM users 
WHERE email IN ('tyler@vxlabs.co')
ORDER BY email;

-- =============================================================================
-- SECTION 11: ENVIRONMENT AND CONFIGURATION
-- =============================================================================

SELECT '==== SECTION 11: ENVIRONMENT AND CONFIGURATION ====' as audit_section;

-- 11.1: Database Version and Settings
SELECT 'STEP 11.1: DATABASE VERSION AND SETTINGS' as step;
SELECT version() as postgres_version;

-- 11.2: Extensions
SELECT 'STEP 11.2: EXTENSIONS' as step;
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension
ORDER BY extname;

-- =============================================================================
-- SECTION 12: MISSING COMPONENTS IDENTIFICATION
-- =============================================================================

SELECT '==== SECTION 12: MISSING COMPONENTS IDENTIFICATION ====' as audit_section;

-- 12.1: Expected Tables vs Actual Tables
SELECT 'STEP 12.1: EXPECTED VS ACTUAL TABLES' as step;
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'users', 'user_roles', 'roles', 'email_templates', 'features',
    'subscriptions', 'transactions', 'webhook_deliveries', 'subscription_events',
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
    WHEN a.actual_table IS NULL THEN 'MISSING TABLE'
    ELSE 'EXISTS'
  END as status
FROM expected_tables e
FULL OUTER JOIN actual_tables a ON e.expected_table = a.actual_table
ORDER BY table_name;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

SELECT '==== FINAL SUMMARY ====' as audit_section;
SELECT 'AUDIT COMPLETE - REVIEW ALL SECTIONS ABOVE FOR ISSUES' as summary;
SELECT 'CRITICAL: Pay special attention to MISSING TABLES, RLS SECURITY, and AUTH LINKAGE' as critical_note; 