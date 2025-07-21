-- Add Payment History Tracking
-- This migration adds comprehensive payment history tracking

-- Create transactions table for payment history
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

-- Create payment_methods table for tracking customer payment methods
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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);

-- Create function to sync payment history from Stripe
CREATE OR REPLACE FUNCTION sync_payment_history(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  customer_id TEXT;
  sync_count INTEGER := 0;
BEGIN
  -- Get customer ID
  SELECT stripe_customer_id INTO customer_id 
  FROM users 
  WHERE id = p_user_id;
  
  IF customer_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- This function would be called from an Edge Function
  -- that fetches payment history from Stripe API
  -- For now, we'll just return 0
  RETURN sync_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for user payment history
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

-- Create view for payment methods
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

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Payment history for all customer transactions';
COMMENT ON TABLE payment_methods IS 'Customer payment methods stored securely';
COMMENT ON FUNCTION sync_payment_history IS 'Syncs payment history from Stripe API'; 