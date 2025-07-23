-- Check if the auth schema and its infrastructure are intact
-- This will help us understand what we accidentally destroyed

-- Check if auth schema exists
SELECT 'CHECKING AUTH SCHEMA' as info;
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Check auth tables
SELECT 'CHECKING AUTH TABLES' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- Check auth functions
SELECT 'CHECKING AUTH FUNCTIONS' as info;
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'auth'
ORDER BY p.proname;

-- Check auth triggers
SELECT 'CHECKING AUTH TRIGGERS' as info;
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth'
ORDER BY trigger_name;

-- Check if auth.users table has data
SELECT 'CHECKING AUTH USERS DATA' as info;
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- Check recent auth user creations
SELECT 'RECENT AUTH USER CREATIONS' as info;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5; 