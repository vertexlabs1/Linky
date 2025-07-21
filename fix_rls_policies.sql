-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Create more permissive policies for Edge Functions
CREATE POLICY "Allow service role full access" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to view their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT TO authenticated USING (auth.uid() = auth_user_id OR auth.email() = email);

-- Allow authenticated users to update their own data  
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id OR auth.email() = email);

-- Allow anon users to insert (for founding member signup)
CREATE POLICY "Allow anon user creation" ON users FOR INSERT TO anon WITH CHECK (true);
