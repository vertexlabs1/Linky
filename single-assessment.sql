-- SINGLE ASSESSMENT QUERY - GETS EVERYTHING IN ONE GO
-- This will show us exactly what we have and what's missing

-- Check all existing tables
SELECT 
  'EXISTING TABLES:' as check_type,
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check users table columns
SELECT 
  'USERS COLUMNS:' as check_type,
  column_name,
  data_type,
  'EXISTS' as status
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for missing critical tables
SELECT 
  'MISSING TABLES:' as check_type,
  'subscriptions' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING TABLES:' as check_type,
  'transactions' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING TABLES:' as check_type,
  'email_templates' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING TABLES:' as check_type,
  'features' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'features' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

SELECT 
  'MISSING TABLES:' as check_type,
  'promotions' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS CREATION'
  END as status;

-- Check for missing critical columns in users table
SELECT 
  'MISSING USERS COLUMNS:' as check_type,
  'stripe_customer_id' as column_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS ADDITION'
  END as status;

SELECT 
  'MISSING USERS COLUMNS:' as check_type,
  'subscription_id' as column_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_id' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS ADDITION'
  END as status;

SELECT 
  'MISSING USERS COLUMNS:' as check_type,
  'subscription_status' as column_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS ADDITION'
  END as status;

SELECT 
  'MISSING USERS COLUMNS:' as check_type,
  'subscription_plan' as column_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING - NEEDS ADDITION'
  END as status; 