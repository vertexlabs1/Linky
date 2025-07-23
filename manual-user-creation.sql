-- Manual user creation for tyleramos2025@gmail.com
-- This user completed payment but webhook failed to create user record

-- First, let's check if the user already exists
SELECT 'CHECKING IF USER EXISTS' as info, 
       id, email, first_name, last_name, auth_user_id, 
       founding_member, status, created_at
FROM users 
WHERE email = 'tyleramos2025@gmail.com';

-- If user doesn't exist, create them
INSERT INTO users (
    email,
    first_name,
    last_name,
    founding_member,
    status,
    email_verified,
    password_set,
    created_at,
    updated_at
) 
SELECT 
    'tyleramos2025@gmail.com',
    'Tyler',
    'Amos',
    true,
    'active',
    false,
    false,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'tyleramos2025@gmail.com'
);

-- Verify the user was created
SELECT 'USER CREATED/VERIFIED' as info,
       id, email, first_name, last_name, auth_user_id,
       founding_member, status, created_at
FROM users 
WHERE email = 'tyleramos2025@gmail.com';

-- Show all founding members for verification
SELECT 'ALL FOUNDING MEMBERS' as info,
       id, email, first_name, last_name, 
       founding_member, status, created_at
FROM users 
WHERE founding_member = true
ORDER BY created_at DESC; 