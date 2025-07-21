-- ============================================================================
-- CREATE ADMIN USER SCRIPT
-- ============================================================================
-- Run this after the cleanup to create your admin user

-- Insert admin user
INSERT INTO users (email, first_name, last_name, status, email_verified, password_set)
VALUES (
    'admin@linky.com', 
    'Admin', 
    'User', 
    'active', 
    true, 
    true
);

-- Get the admin user ID
DO $$
DECLARE
    admin_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@linky.com';
    
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Grant admin role to the user
    INSERT INTO user_roles (user_id, role_id, granted_by, active)
    VALUES (admin_user_id, admin_role_id, admin_user_id, true);
    
    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
END $$;

-- Verify the admin user was created
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    u.status,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@linky.com'; 