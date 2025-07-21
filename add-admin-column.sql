-- Add is_admin column to users table
-- This script adds the simplified admin boolean flag

-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Add comment to document the column
COMMENT ON COLUMN users.is_admin IS 'Simple boolean flag for admin access - replaces complex role system';

-- Update RLS policies to use is_admin
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        -- Allow users to view their own data
        auth.uid() = auth_user_id OR 
        auth.email() = email OR
        -- Allow admins to view all data
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND is_admin = TRUE
        )
    );

-- Create a view for easy admin queries
CREATE OR REPLACE VIEW admin_users AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone,
    company,
    job_title,
    subscription_plan,
    subscription_status,
    founding_member,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    created_at,
    updated_at
FROM users 
WHERE is_admin = TRUE;

-- Create a view for founding members
CREATE OR REPLACE VIEW founding_members AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone,
    company,
    job_title,
    subscription_plan,
    subscription_status,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    created_at,
    updated_at
FROM users 
WHERE founding_member = TRUE;

-- Add helper function to check if user is admin
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

-- Add helper function to grant admin role
CREATE OR REPLACE FUNCTION grant_admin_role(user_uuid UUID, granted_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET is_admin = TRUE, updated_at = NOW()
    WHERE auth_user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to revoke admin role
CREATE OR REPLACE FUNCTION revoke_admin_role(user_uuid UUID, revoked_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET is_admin = FALSE, updated_at = NOW()
    WHERE auth_user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 