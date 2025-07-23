-- SAFE COMPREHENSIVE ASSESSMENT
-- This will show us exactly what's missing without making any changes
-- Based on 3-agent analysis - checking what tables/columns exist vs what should exist

-- =============================================================================
-- PHASE 1: CURRENT DATABASE STATE
-- =============================================================================

SELECT 'PHASE 1: CURRENT DATABASE STATE' as phase;

-- Check what tables currently exist
SELECT 
  'EXISTING TABLES:' as info,
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =============================================================================
-- PHASE 2: USERS TABLE COMPLETENESS CHECK
-- =============================================================================

SELECT 'PHASE 2: USERS TABLE COMPLETENESS CHECK' as phase;

-- Check current users table columns
SELECT 
  'USERS TABLE COLUMNS:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- PHASE 3: MISSING TABLES CHECK
-- =============================================================================

SELECT 'PHASE 3: MISSING TABLES CHECK' as phase;

-- Check for critical missing tables (based on 3-agent analysis)
SELECT 
  'MISSING TABLES CHECK:' as info,
  'subscriptions' as expected_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING TABLES CHECK:' as info,
  'transactions' as expected_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING TABLES CHECK:' as info,
  'email_templates' as expected_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING TABLES CHECK:' as info,
  'features' as expected_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'features' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING TABLES CHECK:' as info,
  'promotions' as expected_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING TABLES CHECK:' as info,
  'founding_members' as expected_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'founding_members' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

-- =============================================================================
-- PHASE 4: MISSING COLUMNS CHECK
-- =============================================================================

SELECT 'PHASE 4: MISSING COLUMNS CHECK' as phase;

-- Check for critical missing columns in users table
SELECT 
  'MISSING USERS COLUMNS:' as info,
  'stripe_customer_id' as expected_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS ADDITION'
  END as status;

SELECT 
  'MISSING USERS COLUMNS:' as info,
  'subscription_id' as expected_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_id' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS ADDITION'
  END as status;

SELECT 
  'MISSING USERS COLUMNS:' as info,
  'subscription_status' as expected_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS ADDITION'
  END as status;

SELECT 
  'MISSING USERS COLUMNS:' as info,
  'subscription_plan' as expected_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS ADDITION'
  END as status;

-- =============================================================================
-- PHASE 5: FUNCTIONS AND TRIGGERS CHECK
-- =============================================================================

SELECT 'PHASE 5: FUNCTIONS AND TRIGGERS CHECK' as phase;

-- Check for critical functions
SELECT 
  'MISSING FUNCTIONS:' as info,
  'handle_new_auth_user' as expected_function,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_auth_user' AND routine_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING FUNCTIONS:' as info,
  'update_updated_at_column' as expected_function,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_updated_at_column' AND routine_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

-- =============================================================================
-- PHASE 6: CURRENT DATA INTEGRITY CHECK
-- =============================================================================

SELECT 'PHASE 6: CURRENT DATA INTEGRITY CHECK' as phase;

-- Check current user count
SELECT 
  'CURRENT USER COUNT:' as info,
  COUNT(*) as user_count
FROM users;

-- Check admin users
SELECT 
  'ADMIN USERS:' as info,
  email,
  first_name,
  last_name,
  is_admin,
  founding_member
FROM users 
WHERE is_admin = true OR founding_member = true
ORDER BY email;

-- =============================================================================
-- PHASE 7: SAFETY CONFIRMATION
-- =============================================================================

SELECT 'PHASE 7: SAFETY CONFIRMATION' as phase;
SELECT 'NO DATABASE CHANGES WERE MADE BY THIS ASSESSMENT' as safety_confirmation; 