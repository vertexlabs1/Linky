-- Add is_admin column to users table
-- Run this in Supabase SQL Editor

-- First, let's see the current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add the is_admin column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_admin'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_admin column to users table';
  ELSE
    RAISE NOTICE 'is_admin column already exists';
  END IF;
END $$;

-- Update Tyler to be an admin
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'tyler@vxlabs.co';

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show current users with admin status
SELECT 
  email,
  first_name,
  last_name,
  is_admin,
  status
FROM users 
ORDER BY created_at DESC; 