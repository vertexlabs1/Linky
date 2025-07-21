-- Create users table for Linky platform
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending',
  subscription_status TEXT DEFAULT 'inactive',
  subscription_plan TEXT DEFAULT 'free',
  founding_member BOOLEAN DEFAULT FALSE,
  password_set BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage all users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = auth_user_id OR auth.email() = email);

-- Grant permissions
GRANT ALL ON users TO service_role;
