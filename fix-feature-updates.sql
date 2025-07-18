-- Fix feature updates that failed during cleanup
-- Run this in Supabase SQL Editor

-- Reset feature upvotes to 0 (with proper WHERE clause)
UPDATE features SET upvotes = 0 WHERE upvotes > 0;

-- Clear submitted_by references in features (with proper WHERE clause)
UPDATE features SET submitted_by = NULL WHERE submitted_by IS NOT NULL;

-- Verify the updates worked
SELECT 
  'features' as table_name,
  COUNT(*) as total_features,
  SUM(upvotes) as total_upvotes,
  COUNT(submitted_by) as features_with_submitted_by
FROM features; 