-- Attempt to repair the Supabase Auth system
-- This tries to recreate the missing auth infrastructure

-- First, let's check what auth tables exist
SELECT 'CHECKING AUTH TABLES' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- Check if the auth.users table has the right structure
SELECT 'CHECKING AUTH.USERS STRUCTURE' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if there are any auth triggers
SELECT 'CHECKING AUTH TRIGGERS' as info;
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth'
ORDER BY trigger_name;

-- Try to recreate the handle_new_auth_user function with proper permissions
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    auth_user_id,
    first_name,
    last_name,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    NEW.email,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Verify the function was created
SELECT 'FUNCTION RECREATED' as info;
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_auth_user';

-- Test if we can create a simple auth user
SELECT 'TESTING AUTH USER CREATION' as info;
-- This will be tested via the API, not directly in SQL 