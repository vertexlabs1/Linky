-- Customer Recovery System
-- Finds users who paid but can't access the service due to missing auth users

-- Find all customers who paid but have no auth user (the problem users)
SELECT '🚨 CUSTOMERS WHO PAID BUT CANNOT ACCESS SERVICE' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    status,
    founding_member,
    created_at,
    updated_at,
    CASE 
        WHEN status = 'active' AND auth_user_id IS NULL THEN '🚨 PAID BUT NO ACCESS'
        WHEN status = 'pending' AND auth_user_id IS NULL THEN '⏳ PENDING PAYMENT'
        WHEN status = 'active' AND auth_user_id IS NOT NULL THEN '✅ FULLY ACTIVE'
        ELSE '❓ UNKNOWN STATE'
    END as customer_state
FROM users 
WHERE status = 'active' 
AND auth_user_id IS NULL
ORDER BY created_at DESC;

-- Count the problem
SELECT '📊 PROBLEM SUMMARY' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'active' AND auth_user_id IS NULL THEN 1 END) as paid_but_no_access,
    COUNT(CASE WHEN status = 'pending' AND auth_user_id IS NULL THEN 1 END) as pending_payment,
    COUNT(CASE WHEN status = 'active' AND auth_user_id IS NOT NULL THEN 1 END) as fully_active
FROM users;

-- Show all users for comparison
SELECT '📋 ALL USERS STATUS' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    status,
    founding_member,
    auth_user_id IS NOT NULL as has_auth_user,
    CASE 
        WHEN status = 'active' AND auth_user_id IS NULL THEN '🚨 PAID BUT NO ACCESS'
        WHEN status = 'pending' AND auth_user_id IS NULL THEN '⏳ PENDING PAYMENT'
        WHEN status = 'active' AND auth_user_id IS NOT NULL THEN '✅ FULLY ACTIVE'
        ELSE '❓ UNKNOWN STATE'
    END as customer_state,
    created_at
FROM users 
ORDER BY created_at DESC; 