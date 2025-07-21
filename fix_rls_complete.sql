-- First, let's disable RLS temporarily to test if that's the issue
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Then re-enable it with proper policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow service role full access" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow anon user creation" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Create a single, permissive policy for service_role (Edge Functions use this)
CREATE POLICY "service_role_all_access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a policy for anon users to insert (for public signups)
CREATE POLICY "anon_can_insert" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create a policy for authenticated users to view/update their own data
CREATE POLICY "users_own_data" ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = auth_user_id OR auth.email() = email)
  WITH CHECK (auth.uid() = auth_user_id OR auth.email() = email);

-- Grant necessary permissions
GRANT ALL ON users TO service_role;
GRANT INSERT ON users TO anon;
GRANT SELECT, UPDATE ON users TO authenticated;
