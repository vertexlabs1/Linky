-- Complete Billing System Database Schema
-- This migration creates all tables and indexes needed for bulletproof billing

-- Enhance users table with complete billing fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_payment_method TEXT;

-- Admin actions audit table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'upgrade', 'downgrade', 'refund', 'cancel', 'pause', 'resume'
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  stripe_object_id TEXT, -- Reference to Stripe object (subscription, refund, etc.)
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Billing events log (for debugging and audit trail)
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  event_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sync health monitoring
CREATE TABLE IF NOT EXISTS sync_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'webhook', 'daily_sync', 'manual', 'health_check'
  status TEXT NOT NULL, -- 'success', 'failure', 'partial', 'running'
  users_processed INTEGER DEFAULT 0,
  errors_encountered INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Refunds tracking table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stripe_refund_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'canceled'
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plan changes history
CREATE TABLE IF NOT EXISTS plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  old_plan TEXT,
  new_plan TEXT,
  old_price_id TEXT,
  new_price_id TEXT,
  effective_date TIMESTAMP,
  proration_amount DECIMAL(10,2),
  reason TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook delivery tracking
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  delivery_status TEXT DEFAULT 'pending', -- 'pending', 'delivered', 'failed', 'retrying'
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_last_sync_at ON users(last_sync_at);

CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_id ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_processed ON billing_events(processed);
CREATE INDEX IF NOT EXISTS idx_billing_events_event_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at);

CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_id ON refunds(stripe_refund_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

CREATE INDEX IF NOT EXISTS idx_plan_changes_user_id ON plan_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_changes_created_at ON plan_changes(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_stripe_event ON webhook_deliveries(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(delivery_status);

-- Enable RLS on new tables
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
CREATE POLICY "Admins can view all admin actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can insert admin actions" ON admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can view all billing events" ON billing_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Service role can manage billing events" ON billing_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can view sync health" ON sync_health
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Service role can manage sync health" ON sync_health
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can view all refunds" ON refunds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage refunds" ON refunds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can view plan changes" ON plan_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Service role can manage webhook deliveries" ON webhook_deliveries
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions for common operations
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_action_type TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_stripe_object_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO admin_actions (
    admin_id,
    target_user_id,
    action_type,
    old_value,
    new_value,
    reason,
    stripe_object_id,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_target_user_id,
    p_action_type,
    p_old_value,
    p_new_value,
    p_reason,
    p_stripe_object_id,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent'
  ) RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user billing data is stale
CREATE OR REPLACE FUNCTION is_billing_data_stale(user_row users) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    user_row.stripe_subscription_id IS NOT NULL 
    AND (
      user_row.last_sync_at IS NULL 
      OR user_row.last_sync_at < NOW() - INTERVAL '24 hours'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get users needing sync
CREATE OR REPLACE FUNCTION get_users_needing_sync()
RETURNS TABLE(
  id UUID,
  email TEXT,
  stripe_subscription_id TEXT,
  last_sync_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.stripe_subscription_id,
    u.last_sync_at
  FROM users u
  WHERE u.stripe_subscription_id IS NOT NULL
    AND (
      u.last_sync_at IS NULL 
      OR u.last_sync_at < NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE admin_actions IS 'Audit trail for all admin actions performed on user accounts';
COMMENT ON TABLE billing_events IS 'Log of all billing-related events from Stripe webhooks';
COMMENT ON TABLE sync_health IS 'Health monitoring for billing data synchronization';
COMMENT ON TABLE refunds IS 'Track all refunds processed through the admin portal';
COMMENT ON TABLE plan_changes IS 'History of subscription plan changes';
COMMENT ON TABLE webhook_deliveries IS 'Track webhook delivery status and retries';

-- Insert initial sync health record
INSERT INTO sync_health (sync_type, status, started_at, completed_at) 
VALUES ('migration', 'success', NOW(), NOW())
ON CONFLICT DO NOTHING; 