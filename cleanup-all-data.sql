-- ============================================================================
-- COMPLETE DATA CLEANUP SCRIPT
-- ============================================================================
-- This script removes all data from all tables while preserving schema
-- Run this in the Supabase SQL Editor to start fresh

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = replica;

-- Clean up all tables in reverse dependency order
-- (child tables first, then parent tables)

-- 1. Clean up junction tables and child tables
TRUNCATE TABLE user_promotions RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE stripe_events RESTART IDENTITY CASCADE;

-- 2. Clean up main data tables
TRUNCATE TABLE newsletter_subscriptions RESTART IDENTITY CASCADE;
TRUNCATE TABLE subscriptions RESTART IDENTITY CASCADE;
TRUNCATE TABLE promotions RESTART IDENTITY CASCADE;

-- 3. Clean up core tables (keep roles as they're reference data)
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify cleanup
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'newsletter_subscriptions', COUNT(*) FROM newsletter_subscriptions
UNION ALL
SELECT 'promotions', COUNT(*) FROM promotions
UNION ALL
SELECT 'user_promotions', COUNT(*) FROM user_promotions
UNION ALL
SELECT 'stripe_events', COUNT(*) FROM stripe_events
UNION ALL
SELECT 'roles', COUNT(*) FROM roles;

-- Show roles (should still have the default roles)
SELECT name, description FROM roles ORDER BY name; 