-- RE-ENABLE RLS WITH PROPER ADMIN POLICIES
-- This ensures Tyler can access the admin panel

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update all data" ON users;

-- Create simplified, working policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        auth.uid() = auth_user_id 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Admins can view all data" ON users
    FOR SELECT USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.auth_user_id = auth.uid() 
            AND admin_user.is_admin = true
        )
    );

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (
        auth.uid() = auth_user_id 
        OR auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.auth_user_id = auth.uid() 
            AND admin_user.is_admin = true
        )
    );

-- Test that Tyler can be found with RLS enabled
SELECT 'RLS TEST - Tyler should be visible:' as test_status;
SELECT 
  email,
  is_admin,
  'Admin access should work now!' as message
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Verify RLS policies are active
SELECT 'RLS POLICIES ACTIVE:' as policy_status;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users'; 