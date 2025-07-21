# 🔧 Fix Payment History Sync Issue

## 🚨 **Problem**
The payment history sync is failing because the `transactions` table doesn't exist in the database.

## ✅ **Solution**
Run this SQL migration in your Supabase dashboard to create the missing table.

---

## 📋 **Step-by-Step Fix**

### **1. Go to Supabase Dashboard**
1. Navigate to: https://supabase.com/dashboard/project/jydldvvsxwosyzwttmui
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### **2. Run the Migration**
Copy and paste this SQL code:

```sql
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
```

### **3. Click "Run"**
Click the **"Run"** button to execute the SQL.

### **4. Test the Fix**
1. Go back to your admin panel
2. Navigate to Users → Click "View Details" on a user
3. Click "Refresh Payment History"
4. You should now see either transactions or a clear "no data" message

---

## 🎯 **What This Fixes**

✅ **Payment History Sync** - The sync function will now work properly
✅ **Database Structure** - Proper table with indexes and constraints
✅ **Error Handling** - Better error messages and debugging
✅ **Performance** - Optimized indexes for fast queries

---

## 🔍 **If Still Not Working**

If you still see "Failed to sync payment history from Stripe", check:

1. **Browser Console** - Look for detailed error messages
2. **Supabase Logs** - Check Edge Function logs in Supabase dashboard
3. **Stripe Customer ID** - Ensure the user has a valid `stripe_customer_id`

The improved sync function now includes:
- ✅ Table creation if missing
- ✅ Detailed logging
- ✅ Better error messages
- ✅ Comprehensive debugging info 