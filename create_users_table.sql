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
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'founding_member', 'pro', 'enterprise', 'Prospector', 'Networker', 'Rainmaker')),
  subscription_type TEXT DEFAULT 'regular' CHECK (subscription_type IN ('regular', 'founding_member_schedule')),
  
  -- Promo tracking (sandbox features)
  promo_active BOOLEAN DEFAULT FALSE,
  promo_type TEXT,
  promo_expiration_date TIMESTAMPTZ,
  founding_member BOOLEAN DEFAULT FALSE,
  
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

-- Grant permissions
GRANT ALL ON users TO service_role;
