-- SECTION-BY-SECTION AUDIT - RUN EACH SECTION SEPARATELY
-- Copy and paste each section individually to see all results

-- =============================================================================
-- SECTION 1: BASIC TABLE INVENTORY
-- =============================================================================

-- Run this first:
SELECT 'CURRENT TABLES IN PUBLIC SCHEMA:' as check_type;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =============================================================================
-- SECTION 2: MISSING CRITICAL TABLES CHECK
-- =============================================================================

-- Run this second:
SELECT 'CRITICAL TABLE EXISTENCE CHECK:' as check_type;
SELECT 
  'users' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN 'EXISTS ✓' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'user_roles' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') 
    THEN 'EXISTS ✓' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'roles' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') 
    THEN 'EXISTS ✓' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'email_templates' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates' AND table_schema = 'public') 
    THEN 'EXISTS ✓' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'webhook_deliveries' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_deliveries' AND table_schema = 'public') 
    THEN 'EXISTS ✓' ELSE 'MISSING ❌' END as status;

-- =============================================================================
-- SECTION 3: USERS TABLE STRUCTURE
-- =============================================================================

-- Run this third:
SELECT 'USERS TABLE COLUMNS:' as check_type;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- SECTION 4: USER DATA
-- =============================================================================

-- Run this fourth:
SELECT 'USER DATA SUMMARY:' as check_type;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as users_with_auth,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users
FROM users;

SELECT 'ALL USERS DETAIL:' as check_type;
SELECT 
  email,
  first_name,
  last_name,
  is_admin,
  auth_user_id,
  stripe_customer_id,
  status,
  email_verified
FROM users
ORDER BY created_at;

-- =============================================================================
-- SECTION 5: AUTH LINKAGE
-- =============================================================================

-- Run this fifth:
SELECT 'AUTH VS DATABASE LINKAGE:' as check_type;
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
-- SECTION 6: SECURITY STATUS
-- =============================================================================

-- Run this sixth:
SELECT 'RLS SECURITY STATUS:' as check_type;
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'SECURED ✓'
    WHEN tablename IN ('users', 'user_roles', 'roles') THEN 'OPEN - CRITICAL RISK! ⚠️'
    ELSE 'OPEN - RISK ⚠️'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename; 