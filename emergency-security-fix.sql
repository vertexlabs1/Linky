-- EMERGENCY SECURITY FIX - Re-enable RLS to protect admin panel
-- This fixes the open admin access vulnerability

-- Re-enable RLS on all tables immediately
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create secure but permissive policies for authenticated users
DROP POLICY IF EXISTS "Allow all authenticated users" ON users;

-- Policy for users to see their own data + admins to see all
CREATE POLICY "Secure user access" ON users
    FOR ALL USING (
        -- Service role (system) can do anything
        auth.role() = 'service_role'
        OR
        -- Authenticated users can see their own data
        (auth.role() = 'authenticated' AND auth.uid() = auth_user_id)
        OR
        -- Admins can see all data
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.auth_user_id = auth.uid() 
            AND admin_user.is_admin = true
        ))
    );

-- Allow authenticated users to read roles
CREATE POLICY "Allow role reads" ON roles
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow authenticated users to read their own user_roles
CREATE POLICY "Allow user_role reads" ON user_roles
    FOR SELECT USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_roles.user_id 
            AND u.auth_user_id = auth.uid()
        )
    );

-- Verify security is restored
SELECT 'SECURITY STATUS:' as check;
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  'Security: ' || CASE WHEN rowsecurity THEN 'PROTECTED' ELSE 'VULNERABLE!' END as status
FROM pg_tables 
WHERE tablename IN ('users', 'user_roles', 'roles')
AND schemaname = 'public';

SELECT 'ADMIN PANEL SHOULD NOW REQUIRE PROPER LOGIN' as security_message; 