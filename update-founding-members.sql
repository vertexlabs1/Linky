-- Update existing founding members with purchase dates
-- This script sets the founding_member_purchased_at field for existing founding members

-- First, let's see what founding members we have
SELECT 
  id,
  email,
  first_name,
  last_name,
  founding_member,
  founding_member_purchased_at,
  founding_member_transition_date,
  founding_member_transitioned_at,
  created_at
FROM users 
WHERE founding_member = true;

-- Update founding members who don't have a purchase date yet
-- Set purchase date to their created_at date
UPDATE users 
SET 
  founding_member_purchased_at = created_at,
  updated_at = NOW()
WHERE 
  founding_member = true 
  AND founding_member_purchased_at IS NULL;

-- Show the updated results
SELECT 
  id,
  email,
  first_name,
  last_name,
  founding_member_purchased_at,
  founding_member_transition_date,
  founding_member_transitioned_at,
  CASE
    WHEN founding_member_transitioned_at IS NOT NULL THEN 'Transitioned'
    WHEN founding_member_transition_date IS NOT NULL AND NOW() > founding_member_transition_date THEN 'Expired - Needs Transition'
    WHEN founding_member_transition_date IS NOT NULL AND NOW() <= founding_member_transition_date THEN 'Active'
    ELSE 'Unknown'
  END AS status,
  CASE
    WHEN founding_member_transitioned_at IS NOT NULL THEN 0
    WHEN founding_member_transition_date IS NOT NULL THEN 
      GREATEST(0, EXTRACT(EPOCH FROM (founding_member_transition_date - NOW())) / 86400)::INTEGER
    ELSE NULL
  END AS days_remaining
FROM users 
WHERE founding_member = true
ORDER BY founding_member_purchased_at; 