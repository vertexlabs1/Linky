-- Fix RLS policies with correct syntax
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view own data via auth_user_id" ON users;
DROP POLICY IF EXISTS "Admins can view all data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update all data" ON users;

-- Create corrected policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        auth.uid() = auth_user_id 
        OR auth.email() = email
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Admins can view all data" ON users
    FOR SELECT USING (
        auth.role() = 'service_role'
        OR is_admin = true
        OR EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.auth_user_id = auth.uid() 
            AND u2.is_admin = true
        )
    );

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (
        auth.uid() = auth_user_id 
        OR auth.email() = email
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Admins can update all data" ON users
    FOR UPDATE USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.auth_user_id = auth.uid() 
            AND u2.is_admin = true
        )
    ); 