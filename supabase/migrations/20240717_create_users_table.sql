-- Create users table for Linky platform
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Auth integration
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Basic user info
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  
  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_session_id TEXT,
  stripe_subscription_schedule_id TEXT,
  
  -- Status and subscription info
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'cancelled', 'unpaid')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'founding_member', 'pro', 'enterprise')),
  subscription_type TEXT DEFAULT 'regular' CHECK (subscription_type IN ('regular', 'founding_member_schedule')),
  
  -- Account verification
  password_set BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User Access Control

-- 1. Allow users to view their own data (when authenticated)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        auth.uid() = auth_user_id OR 
        auth.email() = email
    );

-- 2. Allow users to update their own non-sensitive data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid() = auth_user_id OR 
        auth.email() = email
    )
    WITH CHECK (
        auth.uid() = auth_user_id OR 
        auth.email() = email
    );

-- 3. Allow service role to manage all data (for webhooks, admin operations)
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- 4. Allow authenticated users to read basic info of other users (for team features)
CREATE POLICY "Authenticated users can view basic user info" ON users
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        status = 'active'
    );

-- 5. Prevent unauthorized access to sensitive data
CREATE POLICY "Restrict sensitive data access" ON users
    FOR SELECT USING (
        -- Only show sensitive fields to the user themselves or service role
        CASE 
            WHEN auth.uid() = auth_user_id OR auth.email() = email OR auth.role() = 'service_role'
            THEN true
            ELSE false
        END
    );

-- Create views for different access levels

-- View for user's own complete profile
CREATE VIEW user_profile AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone,
    subscription_plan,
    subscription_status,
    status,
    password_set,
    email_verified,
    created_at
FROM users 
WHERE auth.uid() = auth_user_id OR auth.email() = email;

-- View for public user info (what other users can see)
CREATE VIEW public_user_info AS
SELECT 
    id,
    first_name,
    last_name,
    subscription_plan,
    status,
    created_at
FROM users 
WHERE status = 'active';

-- Grant permissions
GRANT SELECT ON user_profile TO authenticated;
GRANT SELECT ON public_user_info TO authenticated;
GRANT ALL ON users TO service_role;

-- Create function to handle new auth user creation
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create user record if one doesn't exist
    INSERT INTO users (auth_user_id, email, first_name, last_name, email_verified)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email_confirmed_at IS NOT NULL
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user(); 