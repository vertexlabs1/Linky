-- SIMPLE ASSESSMENT - GUARANTEED TO SHOW RESULTS
-- This breaks down the checks into smaller, working queries

-- 1. Check what tables currently exist
SELECT 
  'EXISTING TABLES:' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check users table columns
SELECT 
  'USERS TABLE COLUMNS:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check for critical missing tables
SELECT 
  'MISSING TABLES:' as info,
  'subscriptions' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

SELECT 
  'MISSING TABLES:' as info,
  'transactions' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

SELECT 
  'MISSING TABLES:' as info,
  'email_templates' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

SELECT 
  'MISSING TABLES:' as info,
  'features' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'features' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

SELECT 
  'MISSING TABLES:' as info,
  'promotions' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

-- 4. Check for critical missing columns in users table
SELECT 
  'MISSING USERS COLUMNS:' as info,
  'stripe_customer_id' as column_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

SELECT 
  'MISSING USERS COLUMNS:' as info,
  'subscription_id' as column_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_id' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

SELECT 
  'MISSING USERS COLUMNS:' as info,
  'subscription_status' as column_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

-- 5. Check current user data
SELECT 
  'CURRENT USERS:' as info,
  COUNT(*) as user_count
FROM users;

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