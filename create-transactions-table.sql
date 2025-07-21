-- Create transactions table for payment history
-- This ensures the table exists for the payment history sync to work

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_charge_id ON transactions(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_invoice_id ON transactions(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Create unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_payment_intent_unique ON transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_charge_unique ON transactions(stripe_charge_id) WHERE stripe_charge_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_invoice_unique ON transactions(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Payment history for all customer transactions from Stripe';
COMMENT ON COLUMN transactions.amount IS 'Amount in cents (e.g., 2500 = $25.00)';
COMMENT ON COLUMN transactions.status IS 'Payment status from Stripe'; 