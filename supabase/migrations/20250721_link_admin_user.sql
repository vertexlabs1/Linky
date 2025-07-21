-- ============================================================================
-- LINK ADMIN USER AND SETUP AUTOMATIC LINKING
-- ============================================================================
-- This migration links the existing admin user and sets up automatic linking

-- Link the admin user to their auth user
UPDATE users 
SET 
    auth_user_id = (SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co'),
    password_set = true
WHERE email = 'tyler@vxlabs.co';

-- Create a function to automatically link new auth users to database users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a database user already exists for this email
    IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
        -- Update existing user with auth_user_id
        UPDATE public.users 
        SET 
            auth_user_id = NEW.id,
            password_set = true,
            updated_at = NOW()
        WHERE email = NEW.email;
    ELSE
        -- Create new database user
        INSERT INTO public.users (
            id,
            email,
            first_name,
            last_name,
            auth_user_id,
            status,
            email_verified,
            password_set,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            NEW.id,
            'active',
            NEW.email_confirmed_at IS NOT NULL,
            true,
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically handle new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the admin user is properly linked
SELECT 
    'Admin User Status' as check_type,
    u.email,
    u.first_name,
    u.last_name,
    u.auth_user_id IS NOT NULL as is_linked,
    u.password_set,
    au.id as auth_user_id,
    au.email as auth_email,
    au.role as auth_role
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'tyler@vxlabs.co';

-- Check admin role
SELECT 
    'Admin Role Status' as check_type,
    u.email,
    r.name as role_name,
    ur.active as role_active,
    ur.created_at as role_granted_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co'; 