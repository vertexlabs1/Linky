-- SYSTEMATIC DATABASE FIX FOR TYLER'S PAYMENT HISTORY
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Drop problematic constraints and tables
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- Step 2: Create transactions table with NO restrictive constraints
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create payment_methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_stripe_charge_id ON transactions(stripe_charge_id);
CREATE INDEX idx_transactions_stripe_invoice_id ON transactions(stripe_invoice_id);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

-- Step 5: Create exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO anon;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON payment_methods TO authenticated;

-- Step 7: Verify tables were created
SELECT 'transactions' as table_name, COUNT(*) as row_count FROM transactions
UNION ALL
SELECT 'payment_methods' as table_name, COUNT(*) as row_count FROM payment_methods; 