-- Complete Billing System Migration
-- This migration adds all missing billing system components

-- Create billing_changes table if it doesn't exist
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

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN (
    'succeeded',
    'pending',
    'failed',
    'canceled',
    'refunded',
    'partially_refunded'
  )),
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_billing_changes_user_id ON billing_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_changes_admin_id ON billing_changes(admin_id);
CREATE INDEX IF NOT EXISTS idx_billing_changes_created_at ON billing_changes(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_changes_change_type ON billing_changes(change_type);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);

-- Create or replace functions
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

-- Create views
CREATE OR REPLACE VIEW user_payment_history AS
SELECT 
  t.id,
  t.amount,
  t.currency,
  t.status,
  t.description,
  t.receipt_url,
  t.created_at,
  u.email as user_email,
  u.first_name as user_first_name,
  u.last_name as user_last_name
FROM transactions t
LEFT JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

CREATE OR REPLACE VIEW user_payment_methods AS
SELECT 
  pm.id,
  pm.type,
  pm.card_brand,
  pm.card_last4,
  pm.card_exp_month,
  pm.card_exp_year,
  pm.is_default,
  pm.created_at,
  u.email as user_email,
  u.first_name as user_first_name,
  u.last_name as user_last_name
FROM payment_methods pm
LEFT JOIN users u ON pm.user_id = u.id
ORDER BY pm.is_default DESC, pm.created_at DESC;

-- Add comments
COMMENT ON TABLE billing_changes IS 'Audit trail for all billing-related changes';
COMMENT ON TABLE transactions IS 'Payment history for all customer transactions';
COMMENT ON TABLE payment_methods IS 'Customer payment methods stored securely';
COMMENT ON FUNCTION log_billing_change IS 'Logs billing changes for audit compliance'; 