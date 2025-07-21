# 🚀 Linky Sandbox Setup - Step by Step Guide

## 🎯 **Goal**: Deploy Linky with Stripe sandbox mode for safe testing

---

## **Step 1: Supabase Secrets Setup** ✅

### 1.1 Run the automated setup script:
```bash
cd Linky-Waitlist
chmod +x setup-supabase-secrets.sh
./setup-supabase-secrets.sh
```

This will automatically set:
- ✅ Stripe sandbox secret key
- ✅ Supabase URL

### 1.2 Add your Resend API key manually:
```bash
supabase secrets set RESEND_API_KEY=your_actual_resend_key_here
```

**To get your Resend API key:**
1. Go to [resend.com](https://resend.com)
2. Sign up/login to your account
3. Go to API Keys section
4. Copy your API key

### 1.3 Add your Supabase service role key:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**To get your Supabase service role key:**
1. Go to [supabase.com](https://supabase.com)
2. Open your Linky project
3. Go to Settings → API
4. Copy the "service_role" key (not the anon key)

### 1.4 Deploy Edge Functions:
```bash
supabase functions deploy
```

---

## **Step 2: Database Migration** ✅

### 2.1 Run the database migration:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
-- Add missing columns for promo tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'regular';
```

---

## **Step 3: Vercel Environment Variables** ✅

### 3.1 Add environment variables to Vercel:
1. Go to [vercel.com](https://vercel.com)
2. Open your Linky project
3. Go to Settings → Environment Variables
4. Add these variables:

```
VITE_SUPABASE_URL=https://jydldvvsxwosyzwttmui.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTgwNTAsImV4cCI6MjA2ODI3NDA1MH0.kt8G6d6ZlqxgpU4HFg_vDDBg-0FlozNF4XUq9bf22uw
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RlcEWGgWLKrksJxrWfvsZRIEULa9Ax59echHsFsJ0X91ws2aR3ygGNRhsHGwvDQovgBCEfybqAeCNa5mgBeLj0900qZVLLrNT
FROM_EMAIL=team@uselinky.app
```

### 3.2 Redeploy your site:
1. Go to Deployments tab in Vercel
2. Click "Redeploy" on your latest deployment

---

## **Step 4: Stripe Webhook Setup** ✅

### 4.1 Set up webhooks in Stripe:
1. Go to [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter endpoint URL: `https://jydldvvsxwosyzwttmui.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"

---

## **Step 5: Testing Your Live Site** ✅

### 5.1 Test payment cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### 5.2 Test the complete flow:
1. ✅ User signup
2. ✅ Founding member registration
3. ✅ Stripe checkout process
4. ✅ Payment processing (test only)
5. ✅ Email notifications
6. ✅ Subscription management
7. ✅ Admin dashboard

---

## 🎉 **Success Checklist**

- [ ] Supabase secrets configured
- [ ] Resend API key added
- [ ] Supabase service role key added
- [ ] Edge Functions deployed
- [ ] Database migration completed
- [ ] Vercel environment variables set
- [ ] Site redeployed
- [ ] Stripe webhooks configured
- [ ] Complete flow tested

---

## 🆘 **Need Help?**

If you get stuck on any step:

1. **Supabase CLI issues**: Make sure you're logged in with `supabase login`
2. **Vercel issues**: Check that your project is connected to the right repository
3. **Stripe issues**: Make sure you're in test mode, not live mode
4. **Email issues**: Verify your Resend API key is correct

---

## 🧪 **What You Can Safely Test**

- ✅ Complete user registration
- ✅ Founding member signup ($99/year)
- ✅ Stripe checkout process
- ✅ Test payments (no real money)
- ✅ Email notifications
- ✅ Subscription management
- ✅ Admin dashboard
- ✅ Feature requests system

**All payments are test transactions - no real money will be charged!** 