-- ============================================================================
-- CREATE TYLER AMOS AS ADMIN USER
-- ============================================================================
-- Run this after the cleanup to create Tyler as admin

-- Insert Tyler Amos as admin user
INSERT INTO users (email, first_name, last_name, phone, status, email_verified, password_set)
VALUES (
    'tyler@vxlabs.co', 
    'Tyler', 
    'Amos', 
    '(615) 602-0218',
    'active', 
    true, 
    true
);

-- Get the admin user ID and grant admin role
DO $$
DECLARE
    tyler_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get Tyler's user ID
    SELECT id INTO tyler_user_id FROM users WHERE email = 'tyler@vxlabs.co';
    
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Grant admin role to Tyler
    INSERT INTO user_roles (user_id, role_id, granted_by, active)
    VALUES (tyler_user_id, admin_role_id, tyler_user_id, true);
    
    RAISE NOTICE 'Tyler Amos created as admin with ID: %', tyler_user_id;
END $$;

-- Verify Tyler was created as admin
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    u.phone,
    u.status,
    r.name as role_name,
    ur.active as role_active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co';

-- Show all current users and their roles
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    u.status,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.created_at; 