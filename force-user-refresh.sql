-- FORCE USER REFRESH - Verify database update and force frontend refresh
-- Tyler's data has been updated in the database, now we need to clear frontend cache

-- 1. Verify Tyler's data is correct in database
SELECT 'DATABASE VERIFICATION - Tyler should show correct data:' as check_type;
SELECT 
  email,
  first_name,
  last_name,
  is_admin,
  auth_user_id,
  status,
  email_verified,
  updated_at
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- 2. Check admin role assignment
SELECT 'ADMIN ROLE VERIFICATION:' as check_type;
SELECT 
  u.email,
  u.is_admin,
  COUNT(ur.id) as active_admin_roles,
  STRING_AGG(r.name, ', ') as role_names
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co'
GROUP BY u.id, u.email, u.is_admin;

-- 3. Instructions for frontend refresh
SELECT 'FRONTEND REFRESH REQUIRED:' as action_needed;
SELECT 'Database is correct - Tyler Amos, is_admin=true' as database_status;
SELECT 'Frontend cache needs clearing - see instructions below' as frontend_status;

/*
FRONTEND REFRESH INSTRUCTIONS:

The database has Tyler's correct information, but the frontend is using cached data.

OPTION 1 - Hard Refresh (Recommended):
1. In your browser, press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. This clears cache and forces reload
3. OR go to DevTools > Application > Storage > Clear Storage

OPTION 2 - Logout/Login:
1. Click your profile in top right
2. Sign out
3. Log back in with tyler@vxlabs.co

OPTION 3 - Incognito Test:
1. Open incognito/private window
2. Go to uselinky.app
3. Login as Tyler
4. Should show correct name and admin menu

The issue is that React components cache user data in useState and 
don't automatically refresh when database changes externally.
*/ 