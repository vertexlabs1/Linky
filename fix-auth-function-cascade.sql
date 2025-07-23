-- Fix the handle_new_auth_user function to resolve the "role mutable search_path" warning
-- This warning is likely causing auth user creation to fail

-- First, let's see the current function definition
SELECT 'CURRENT FUNCTION DEFINITION' as info;
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_auth_user';

-- Drop the trigger first (since it depends on the function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop the problematic function
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- Recreate the function with proper security settings
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Verify the function was recreated properly
SELECT 'FUNCTION RECREATED' as info;
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_auth_user';

-- Verify the trigger was recreated
SELECT 'TRIGGER RECREATED' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- Test the function by checking if it can be called
SELECT 'FUNCTION TEST' as info;
SELECT public.handle_new_auth_user() IS NOT NULL as function_works; 