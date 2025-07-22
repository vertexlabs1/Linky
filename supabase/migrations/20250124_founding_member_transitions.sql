-- Founding Member Transition System
-- This migration adds fields to track founding member lifecycle and automatic transitions

-- Add founding member transition tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS founding_member_purchased_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS founding_member_transition_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS founding_member_transitioned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS founding_member_original_plan_id TEXT,
ADD COLUMN IF NOT EXISTS founding_member_transition_plan_id TEXT;

-- Create index for efficient founding member queries
CREATE INDEX IF NOT EXISTS idx_users_founding_member_transition_date 
ON users(founding_member_transition_date) 
WHERE founding_member = TRUE AND founding_member_transitioned_at IS NULL;

-- Create index for founding member purchase date
CREATE INDEX IF NOT EXISTS idx_users_founding_member_purchased_at 
ON users(founding_member_purchased_at) 
WHERE founding_member = TRUE;

-- Create function to calculate founding member transition date (3 months from purchase)
CREATE OR REPLACE FUNCTION calculate_founding_member_transition_date(purchase_date TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN purchase_date + INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql;

-- Create function to update founding member transition date when purchase date is set
CREATE OR REPLACE FUNCTION update_founding_member_transition_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.founding_member = TRUE AND NEW.founding_member_purchased_at IS NOT NULL THEN
    NEW.founding_member_transition_date = calculate_founding_member_transition_date(NEW.founding_member_purchased_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set transition date
DROP TRIGGER IF EXISTS trigger_update_founding_member_transition_date ON users;
CREATE TRIGGER trigger_update_founding_member_transition_date
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_founding_member_transition_date();

-- Create function to get founding member status
CREATE OR REPLACE FUNCTION get_founding_member_status(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  result JSONB;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF user_record.founding_member = FALSE THEN
    RETURN jsonb_build_object('is_founding_member', false);
  END IF;
  
  result := jsonb_build_object(
    'is_founding_member', true,
    'purchased_at', user_record.founding_member_purchased_at,
    'transition_date', user_record.founding_member_transition_date,
    'transitioned_at', user_record.founding_member_transitioned_at,
    'days_remaining', CASE 
      WHEN user_record.founding_member_transitioned_at IS NOT NULL THEN 0
      WHEN user_record.founding_member_transition_date IS NOT NULL THEN 
        GREATEST(0, EXTRACT(EPOCH FROM (user_record.founding_member_transition_date - NOW())) / 86400)::INTEGER
      ELSE NULL
    END,
    'status', CASE
      WHEN user_record.founding_member_transitioned_at IS NOT NULL THEN 'transitioned'
      WHEN user_record.founding_member_transition_date IS NOT NULL AND NOW() > user_record.founding_member_transition_date THEN 'expired'
      WHEN user_record.founding_member_transition_date IS NOT NULL THEN 'active'
      ELSE 'unknown'
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark founding member as transitioned
CREATE OR REPLACE FUNCTION mark_founding_member_transitioned(
  user_uuid UUID,
  new_plan_id TEXT DEFAULT 'price_75_monthly'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF user_record.founding_member = FALSE THEN
    RETURN FALSE;
  END IF;
  
  IF user_record.founding_member_transitioned_at IS NOT NULL THEN
    RETURN FALSE; -- Already transitioned
  END IF;
  
  UPDATE users SET
    founding_member_transitioned_at = NOW(),
    founding_member_transition_plan_id = new_plan_id,
    subscription_plan = 'prospector', -- Default to prospector plan
    subscription_status = 'active',
    updated_at = NOW()
  WHERE id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create view for founding members that need transition
CREATE OR REPLACE VIEW founding_members_needing_transition AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  founding_member_purchased_at,
  founding_member_transition_date,
  founding_member_transitioned_at,
  EXTRACT(EPOCH FROM (founding_member_transition_date - NOW())) / 86400 AS days_until_transition
FROM users 
WHERE 
  founding_member = TRUE 
  AND founding_member_transitioned_at IS NULL
  AND founding_member_transition_date IS NOT NULL
  AND NOW() >= founding_member_transition_date;

-- Create view for founding member status overview
CREATE OR REPLACE VIEW founding_member_status_overview AS
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
WHERE founding_member = TRUE; 