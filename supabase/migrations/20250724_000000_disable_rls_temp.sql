-- Temporarily disable RLS to allow admin access
-- This is a temporary fix until we can implement proper admin authentication

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role; 