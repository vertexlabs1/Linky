-- Add Change History Tracking
-- This migration adds comprehensive change tracking for billing and admin actions

-- Create billing_changes table for audit trail
CREATE TABLE IF NOT EXISTS billing_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id),
  change_type TEXT NOT NULL CHECK (change_type IN (
    'billing_update', 
    'payment_method_add', 
    'payment_method_remove',
    'subscription_change',
    'refund_processed',
    'account_update'
  )),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_actions table for general admin activity
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_billing_changes_user_id ON billing_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_changes_admin_id ON billing_changes(admin_id);
CREATE INDEX IF NOT EXISTS idx_billing_changes_created_at ON billing_changes(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_changes_change_type ON billing_changes(change_type);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);

-- Create function to log billing changes
CREATE OR REPLACE FUNCTION log_billing_change(
  p_user_id UUID,
  p_admin_id UUID,
  p_change_type TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  change_id UUID;
BEGIN
  INSERT INTO billing_changes (
    user_id,
    admin_id,
    change_type,
    old_values,
    new_values,
    reason,
    stripe_customer_id,
    stripe_subscription_id
  ) VALUES (
    p_user_id,
    p_admin_id,
    p_change_type,
    p_old_values,
    p_new_values,
    p_reason,
    (SELECT stripe_customer_id FROM users WHERE id = p_user_id),
    (SELECT stripe_subscription_id FROM users WHERE id = p_user_id)
  ) RETURNING id INTO change_id;
  
  RETURN change_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action_type,
    p_target_user_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for recent billing changes
CREATE OR REPLACE VIEW recent_billing_changes AS
SELECT 
  bc.id,
  bc.change_type,
  bc.created_at,
  bc.reason,
  u.email as user_email,
  u.first_name as user_first_name,
  u.last_name as user_last_name,
  a.email as admin_email,
  a.first_name as admin_first_name,
  a.last_name as admin_last_name
FROM billing_changes bc
LEFT JOIN users u ON bc.user_id = u.id
LEFT JOIN users a ON bc.admin_id = a.id
ORDER BY bc.created_at DESC;

-- Create view for admin activity
CREATE OR REPLACE VIEW admin_activity AS
SELECT 
  aa.id,
  aa.action_type,
  aa.created_at,
  aa.details,
  admin.email as admin_email,
  admin.first_name as admin_first_name,
  admin.last_name as admin_last_name,
  target.email as target_user_email,
  target.first_name as target_user_first_name,
  target.last_name as target_user_last_name
FROM admin_actions aa
LEFT JOIN users admin ON aa.admin_id = admin.id
LEFT JOIN users target ON aa.target_user_id = target.id
ORDER BY aa.created_at DESC;

-- Add comments for documentation
COMMENT ON TABLE billing_changes IS 'Audit trail for all billing-related changes';
COMMENT ON TABLE admin_actions IS 'Audit trail for all admin actions';
COMMENT ON FUNCTION log_billing_change IS 'Logs billing changes for audit compliance';
COMMENT ON FUNCTION log_admin_action IS 'Logs admin actions for security monitoring'; 