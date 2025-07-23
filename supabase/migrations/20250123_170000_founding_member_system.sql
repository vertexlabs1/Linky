-- Add founding member system columns to users table
-- These columns will track founding member payments and transitions

-- Core tracking fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_purchased_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50) NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_payment_session_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_webhook_processed BOOLEAN DEFAULT FALSE;

-- Create audit table for tracking subscription transitions
CREATE TABLE IF NOT EXISTS user_subscription_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_plan VARCHAR(50),
    to_plan VARCHAR(50),
    transition_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_founding_member_expires ON users(founding_member_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_user_subscription_transitions_user_id ON user_subscription_transitions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscription_transitions_date ON user_subscription_transitions(transition_date);

-- Add comments for documentation
COMMENT ON COLUMN users.founding_member_purchased_at IS 'When the user purchased their founding member plan';
COMMENT ON COLUMN users.founding_member_expires_at IS 'When the founding member period expires (3 months from purchase)';
COMMENT ON COLUMN users.subscription_type IS 'Type of subscription: none, founding_member_one_time, prospector_monthly';
COMMENT ON COLUMN users.founding_member_payment_session_id IS 'Stripe session ID for the founding member payment';
COMMENT ON COLUMN users.founding_member_webhook_processed IS 'Whether the founding member payment webhook has been processed'; 