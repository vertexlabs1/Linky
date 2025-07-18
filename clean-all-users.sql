-- Clean All Users SQL Script
-- Run this in Supabase SQL Editor for a complete user data cleanup

-- Step 1: Delete feature votes (user-related data)
DELETE FROM feature_votes;

-- Step 2: Delete feature comments (user-related data)  
DELETE FROM feature_comments;

-- Step 3: Reset feature upvotes to 0
UPDATE features SET upvotes = 0;

-- Step 4: Clear submitted_by references in features
UPDATE features SET submitted_by = NULL;

-- Step 5: Delete all users
DELETE FROM users;

-- Step 6: Delete email subscribers (try both table names)
-- Try active_subscribers first
DELETE FROM active_subscribers;

-- If the above fails, try email_subscribers
-- DELETE FROM email_subscribers;

-- Step 7: Verify cleanup
SELECT 
  'users' as table_name,
  COUNT(*) as remaining_records
FROM users
UNION ALL
SELECT 
  'feature_votes' as table_name,
  COUNT(*) as remaining_records
FROM feature_votes
UNION ALL
SELECT 
  'feature_comments' as table_name,
  COUNT(*) as remaining_records
FROM feature_comments;

-- Optional: Check if active_subscribers table exists and clean it
-- (Uncomment if you know the table exists)
-- DELETE FROM active_subscribers; 