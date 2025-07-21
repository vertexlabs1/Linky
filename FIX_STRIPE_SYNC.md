# 🔧 Fix Stripe Sync Issues

## 🚨 **Problem Identified**
The payment history sync is failing because:
1. **Invalid API Key** - The Supabase anon key being used is incorrect
2. **Missing Database Tables** - The `transactions` table doesn't exist
3. **Stripe API Connection** - Need to verify Stripe sandbox keys are working

## ✅ **Solution Steps**

### **Step 1: Get Correct API Keys**

**Go to your Supabase Dashboard:**
1. Navigate to: https://supabase.com/dashboard/project/jydldvvsxwosyzwttmui
2. Click **"Settings"** → **"API"**
3. Copy the **anon public key** (not the service role key)

### **Step 2: Update the Frontend Code**

Replace the API key in `src/admin/pages/UsersPage.tsx`:

```typescript
// Find this line in the fetchUserTransactions function:
'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY

// Make sure your .env file has the correct key:
VITE_SUPABASE_ANON_KEY=your_correct_anon_key_here
```

### **Step 3: Create Database Tables**

**Run this SQL in your Supabase SQL Editor:**

```sql
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
```

### **Step 4: Verify Stripe Keys**

**Check your Stripe sandbox keys:**
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
3. Verify it matches what's in your Supabase secrets

### **Step 5: Test the Fix**

**After making these changes:**

1. **Update your environment variables** with the correct API keys
2. **Run the SQL migration** to create the transactions table
3. **Test in the admin panel:**
   - Go to Users → Click "View Details" on a user
   - Click "Refresh Payment History"
   - Check browser console for detailed logs

### **Step 6: Debug Information**

**If still not working, check:**

1. **Browser Console** - Look for detailed error messages
2. **Network Tab** - Check the actual API calls being made
3. **Supabase Logs** - Check Edge Function logs in Supabase dashboard
4. **Stripe Dashboard** - Verify customer has payment history

### **Expected Results**

✅ **Working Sync:**
- Payment history shows actual transactions
- "Refresh Payment History" button works
- No more "Failed to sync" errors

❌ **Still Broken:**
- Check browser console for specific error messages
- Verify API keys are correct
- Ensure user has `stripe_customer_id`

---

## 🔍 **Quick Test**

**To test if the fix worked:**

1. Open browser console (F12)
2. Go to admin panel → Users → View Details
3. Click "Refresh Payment History"
4. Look for console logs showing:
   - ✅ "Found X transactions" or
   - ✅ "Synced X transactions from Stripe" or
   - ❌ Specific error messages

**The key issue was the invalid API key causing 401 errors!** 