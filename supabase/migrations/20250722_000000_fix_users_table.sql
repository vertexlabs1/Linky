-- Fix Users Table - Make it the single source of truth
-- This migration ensures the users table has all necessary columns and proper structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate the users table with proper structure
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  company VARCHAR(255),
  job_title VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_plan VARCHAR(50) DEFAULT 'prospector',
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  status VARCHAR(50) DEFAULT 'active',
  is_admin BOOLEAN DEFAULT FALSE,
  founding_member BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_founding_member ON users(founding_member);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Allow admins to see all data
CREATE POLICY "Admins can view all data" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- Allow service role to do everything
CREATE POLICY "Service role can do everything" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to sync auth.users to public.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    '',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update user data
CREATE OR REPLACE FUNCTION update_user_data(
  user_id UUID,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  company VARCHAR(255),
  job_title VARCHAR(255)
)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    first_name = update_user_data.first_name,
    last_name = update_user_data.last_name,
    phone = update_user_data.phone,
    company = update_user_data.company,
    job_title = update_user_data.job_title,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = user_uuid 
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to grant admin role
CREATE OR REPLACE FUNCTION grant_admin_role(user_uuid UUID, granted_by UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET is_admin = TRUE, updated_at = NOW()
  WHERE auth_user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to revoke admin role
CREATE OR REPLACE FUNCTION revoke_admin_role(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET is_admin = FALSE, updated_at = NOW()
  WHERE auth_user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert Tyler as admin if he doesn't exist
INSERT INTO users (
  auth_user_id,
  email,
  first_name,
  last_name,
  phone,
  subscription_plan,
  subscription_status,
  status,
  is_admin,
  founding_member,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  'tyler@vxlabs.co',
  'Tyler',
  'Amos',
  '(615) 602-0218',
  'prospector',
  'active',
  'active',
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'tyler@vxlabs.co'
AND NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = 'tyler@vxlabs.co'
);

-- Update Tyler if he exists
UPDATE users 
SET 
  first_name = 'Tyler',
  last_name = 'Amos',
  phone = '(615) 602-0218',
  status = 'active',
  subscription_plan = 'prospector',
  subscription_status = 'active',
  is_admin = TRUE,
  founding_member = TRUE,
  updated_at = NOW()
WHERE email = 'tyler@vxlabs.co';

-- Link Tyler to his auth user if not linked
UPDATE users 
SET auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co'
)
WHERE email = 'tyler@vxlabs.co' 
AND auth_user_id IS NULL; 