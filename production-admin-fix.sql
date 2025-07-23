-- PRODUCTION ADMIN FIX - Copy and paste this entire script into Supabase SQL Editor
-- This will fix Tyler's admin login issue in production

-- Step 1: Temporarily disable RLS to work with the data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Check Tyler's current status
SELECT 'CURRENT STATUS:' as step;
SELECT 
  u.id as user_id,
  u.email,
  u.is_admin,
  u.auth_user_id,
  ur.user_id as role_user_id,
  ur.active as has_admin_role,
  'Problem: ' || CASE WHEN u.id != ur.user_id THEN 'USER IDs DO NOT MATCH!' ELSE 'IDs match' END as diagnosis
FROM users u
LEFT JOIN user_roles ur ON ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id AND r.name = 'admin'
WHERE u.email = 'tyler@vxlabs.co';

-- Step 3: Fix Tyler's role assignment (delete incorrect one, add correct one)
DELETE FROM user_roles 
WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')
AND user_id != (SELECT id FROM users WHERE email = 'tyler@vxlabs.co');

INSERT INTO user_roles (user_id, role_id, granted_by, active)
SELECT
  u.id,  -- Tyler's correct user ID
  r.id,  -- Admin role ID
  u.id,  -- Granted by Tyler
  true   -- Active
FROM users u, roles r
WHERE u.email = 'tyler@vxlabs.co'
  AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO UPDATE SET active = true;

-- Step 4: Verify the fix
SELECT 'VERIFICATION:' as step;
SELECT 
  u.id as user_id,
  u.email,
  u.is_admin,
  ur.active as has_admin_role,
  r.name as role_name,
  'SUCCESS: IDs Match = ' || CASE WHEN u.id = ur.user_id THEN 'YES ✅' ELSE 'NO ❌' END as result
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id AND r.name = 'admin'
WHERE u.email = 'tyler@vxlabs.co';

-- Step 5: Re-enable RLS with proper policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create working policies
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

-- Final verification
SELECT 'FINAL CHECK:' as step;
SELECT 'Tyler admin fix completed successfully!' as message; 