-- Quick test to check email_subscribers table
-- Run this in Supabase SQL Editor

-- 1. Check if table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_subscribers'
ORDER BY ordinal_position;

-- 2. Try a simple insert
INSERT INTO email_subscribers (email, first_name, last_name, active)
VALUES ('test@example.com', 'Test', 'User', TRUE);

-- 3. Check if insert worked
SELECT * FROM email_subscribers WHERE email = 'test@example.com';

-- 4. Clean up
DELETE FROM email_subscribers WHERE email = 'test@example.com'; 