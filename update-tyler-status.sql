-- Update Tyler's status and add is_admin column
-- Run this in your Supabase SQL Editor

-- Add is_admin column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update Tyler's status to active
UPDATE users 
SET status = 'active', updated_at = NOW()
WHERE email = 'tyler@vxlabs.co';

-- Set Tyler as admin
UPDATE users 
SET is_admin = TRUE, updated_at = NOW()
WHERE email = 'tyler@vxlabs.co';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Verify the changes
SELECT 
  email,
  first_name,
  last_name,
  status,
  is_admin,
  subscription_plan,
  subscription_status
FROM users 
WHERE email = 'tyler@vxlabs.co'; 