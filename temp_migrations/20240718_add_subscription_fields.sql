-- Add fields to track subscription upgrades and founding member status
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_expired BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update existing founding members with expiration date (3 months from creation)
UPDATE users 
SET founding_member_expires_at = created_at + INTERVAL '3 months'
WHERE founding_member = TRUE 
AND founding_member_expires_at IS NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_founding_member_expires ON users(founding_member_expires_at) 
WHERE founding_member = TRUE AND founding_member_expired = FALSE;

-- Add function to check if founding member period has expired
CREATE OR REPLACE FUNCTION check_founding_member_expired()
RETURNS TRIGGER AS $$
BEGIN
  -- If founding_member_expires_at is in the past, mark as expired
  IF NEW.founding_member_expires_at IS NOT NULL 
     AND NEW.founding_member_expires_at < NOW() 
     AND NEW.founding_member_expired = FALSE THEN
    NEW.founding_member_expired = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically mark expired founding members
DROP TRIGGER IF EXISTS trigger_check_founding_member_expired ON users;
CREATE TRIGGER trigger_check_founding_member_expired
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_founding_member_expired();

-- Create subscription_events table to track all subscription changes
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed'
  old_plan TEXT,
  new_plan TEXT,
  stripe_subscription_id TEXT,
  stripe_event_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for subscription events
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

-- Enable RLS on subscription_events table
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own subscription events
CREATE POLICY "Users can view own subscription events" ON subscription_events
  FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Allow service role to manage all subscription events
CREATE POLICY "Service role can manage subscription events" ON subscription_events
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE subscription_events IS 'Track all subscription changes and upgrades';
COMMENT ON COLUMN users.founding_member_expires_at IS 'When the founding member 3-month period expires';
COMMENT ON COLUMN users.founding_member_expired IS 'Whether the founding member period has ended';
COMMENT ON COLUMN users.upgraded_at IS 'When the user was last upgraded to a new plan';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Current Stripe subscription ID'; 