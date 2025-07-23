-- Test that the handle_new_auth_user function was fixed properly
-- (without trying to call it directly, since it's a trigger function)

-- Check if the function exists and has proper security settings
SELECT 'FUNCTION STATUS CHECK' as info;
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    n.nspname as schema_name,
    CASE 
        WHEN p.prosecdef = true THEN '✅ SECURITY DEFINER (FIXED)'
        ELSE '❌ NOT SECURITY DEFINER (STILL BROKEN)'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_auth_user';

-- Check if the trigger exists and is properly configured
SELECT 'TRIGGER STATUS CHECK' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ TRIGGER EXISTS'
        ELSE '❌ TRIGGER MISSING'
    END as trigger_status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- Check if the user was created successfully
SELECT 'USER CREATION CHECK' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    auth_user_id,
    founding_member, 
    status, 
    created_at,
    CASE 
        WHEN email = 'tyleramos2025@gmail.com' THEN '✅ USER EXISTS'
        ELSE '❌ USER MISSING'
    END as user_status
FROM users 
WHERE email = 'tyleramos2025@gmail.com';

-- Show all founding members for verification
SELECT 'ALL FOUNDING MEMBERS' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    founding_member, 
    status, 
    created_at
FROM users 
WHERE founding_member = true
ORDER BY created_at DESC; 