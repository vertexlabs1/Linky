-- COMPREHENSIVE CLEANUP CHECK SCRIPT
-- This script checks all tables for any lingering data from test users
-- Run this in your Supabase SQL editor

-- STEP 1: Check users table
SELECT 'USERS TABLE' as table_name, COUNT(*) as record_count FROM users;

-- STEP 2: Check if there are any auth.users that don't match our users table
SELECT 'AUTH USERS NOT IN USERS TABLE' as check_type, COUNT(*) as count
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.email = au.email
);

-- STEP 3: Check transactions table
SELECT 'TRANSACTIONS TABLE' as table_name, COUNT(*) as record_count FROM transactions;

-- STEP 4: Check if there are transactions for non-existent users
SELECT 'TRANSACTIONS FOR DELETED USERS' as check_type, COUNT(*) as count
FROM transactions t
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = t.user_id
);

-- STEP 5: Check email_subscribers table
SELECT 'EMAIL_SUBSCRIBERS TABLE' as table_name, COUNT(*) as record_count FROM email_subscribers;

-- STEP 6: Check if there are email subscribers that don't match users
SELECT 'EMAIL SUBSCRIBERS NOT IN USERS' as check_type, COUNT(*) as count
FROM email_subscribers es
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.email = es.email
);

-- STEP 7: Show any orphaned transactions (if any)
SELECT 'ORPHANED TRANSACTIONS' as check_type, t.*
FROM transactions t
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = t.user_id
);

-- STEP 8: Show any orphaned email subscribers (if any)
SELECT 'ORPHANED EMAIL SUBSCRIBERS' as check_type, es.*
FROM email_subscribers es
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.email = es.email
);

-- STEP 9: Show all auth.users (to see if there are any test accounts)
SELECT 'ALL AUTH USERS' as check_type, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- STEP 10: Show current users with their details
SELECT 'CURRENT USERS' as check_type, id, email, first_name, last_name, status, subscription_status, founding_member, created_at
FROM users
ORDER BY created_at DESC; 