# 🚀 Linky Production Transition Guide

## 📋 **Overview**
This guide provides step-by-step instructions for transitioning your Linky application from Stripe sandbox mode to production mode.

---

## ⚠️ **IMPORTANT PRE-PRODUCTION CHECKLIST**

### **Before Going Live:**
- [ ] Test all features thoroughly in sandbox
- [ ] Verify email templates are production-ready
- [ ] Test admin dashboard functionality
- [ ] Confirm all webhook events are working
- [ ] Review pricing and subscription plans
- [ ] Set up monitoring and alerting
- [ ] Prepare customer support processes

---

## 🔄 **STEP 1: UPDATE STRIPE KEYS**

### **1.1 Get Production Stripe Keys**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Switch from "Test mode" to "Live mode"
3. Copy your production keys:
   - **Publishable Key**: `pk_live_...`
   - **Secret Key**: `sk_live_...`

### **1.2 Update Vercel Environment Variables**
In your Vercel dashboard, update these variables:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key_here
```

### **1.3 Update Supabase Secrets**
```bash
# Update Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_production_secret_key_here

# Update webhook secret (you'll get this in step 2)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

---

## 🔗 **STEP 2: CONFIGURE PRODUCTION WEBHOOKS**

### **2.1 Create Production Webhook**
1. Go to [Stripe Dashboard (Live Mode)](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. **Endpoint URL**: `https://jydldvvsxwosyzwttmui.supabase.co/functions/v1/stripe-webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `subscription_schedule.released`
5. Click "Add endpoint"
6. **Copy the webhook secret** and update Supabase (step 1.3)

### **2.2 Test Production Webhook**
1. In Stripe Dashboard, click "Send test event"
2. Select `checkout.session.completed`
3. Verify the webhook is received successfully

---

## 💳 **STEP 3: UPDATE STRIPE PRODUCTS & PRICES**

### **3.1 Create Production Products**
In Stripe Dashboard (Live Mode), create these products:

#### **Founding Member**
- **Price**: $25 one-time
- **Description**: 3-month founding member access
- **Metadata**: `type: founding_member`

#### **Prospector Plan**
- **Price**: $75/month
- **Description**: Basic LinkedIn automation
- **Metadata**: `type: prospector`

#### **Networker Plan**
- **Price**: $145/month
- **Description**: Advanced features
- **Metadata**: `type: networker`

#### **Rainmaker Plan**
- **Price**: $199/month
- **Description**: Premium features
- **Metadata**: `type: rainmaker`

### **3.2 Update Price IDs in Code**
Update `src/lib/stripe/stripe-service.ts`:
```typescript
// Replace sandbox price IDs with production IDs
const PRICE_IDS = {
  foundingMember: 'price_live_your_founding_member_price_id',
  prospector: 'price_live_your_prospector_price_id',
  networker: 'price_live_your_networker_price_id',
  rainmaker: 'price_live_your_rainmaker_price_id'
}
```

---

## 📧 **STEP 4: UPDATE EMAIL CONFIGURATION**

### **4.1 Update Email Templates**
1. Go to [Resend Dashboard](https://resend.com)
2. Update email templates for production
3. Test all email flows

### **4.2 Update FROM_EMAIL**
In Vercel environment variables:
```
FROM_EMAIL=team@uselinky.app
```

---

## 🗄️ **STEP 5: DATABASE MIGRATION**

### **5.1 Backup Current Data**
```sql
-- Backup current users (if any)
CREATE TABLE users_backup AS SELECT * FROM users;
```

### **5.2 Update Database Configuration**
1. Go to Supabase Dashboard
2. Update any sandbox-specific configurations
3. Verify Row Level Security policies

---

## 🚀 **STEP 6: DEPLOYMENT**

### **6.1 Deploy Updated Code**
```bash
# Commit your changes
git add .
git commit -m "Switch to production Stripe configuration"
git push origin main
```

### **6.2 Redeploy Edge Functions**
```bash
supabase functions deploy
```

### **6.3 Verify Deployment**
1. Check Vercel deployment status
2. Test the live site functionality
3. Verify webhook events are working

---

## 🧪 **STEP 7: TESTING**

### **7.1 Production Testing Checklist**
- [ ] **User Registration**: Test complete signup flow
- [ ] **Payment Processing**: Test with real payment methods
- [ ] **Webhook Events**: Verify all events are processed
- [ ] **Email Notifications**: Test all email flows
- [ ] **Admin Dashboard**: Verify admin functionality
- [ ] **Subscription Management**: Test plan changes
- [ ] **Error Handling**: Test failed payments

### **7.2 Monitor for 24 Hours**
- Check Stripe Dashboard for successful payments
- Monitor webhook delivery rates
- Watch for any error logs
- Verify email delivery

---

## 📊 **STEP 8: MONITORING & MAINTENANCE**

### **8.1 Set Up Monitoring**
1. **Stripe Dashboard**: Monitor payment success rates
2. **Supabase Logs**: Monitor Edge Function performance
3. **Vercel Analytics**: Track site performance
4. **Email Delivery**: Monitor Resend delivery rates

### **8.2 Regular Maintenance Tasks**
- **Daily**: Check webhook delivery rates
- **Weekly**: Review failed payments
- **Monthly**: Analyze subscription metrics
- **Quarterly**: Review and update pricing

---

## 🚨 **EMERGENCY ROLLBACK PROCEDURE**

### **If Issues Arise:**
1. **Immediate**: Switch back to sandbox keys
2. **Investigate**: Check logs and error reports
3. **Fix**: Resolve the specific issue
4. **Test**: Verify in sandbox environment
5. **Redeploy**: Switch back to production

### **Rollback Commands:**
```bash
# Switch back to sandbox
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_sandbox_secret_key_here

# Update Vercel environment
# Change VITE_STRIPE_PUBLISHABLE_KEY back to pk_test_...
```

---

## 📋 **PRODUCTION CONFIGURATION SUMMARY**

### **Environment Variables:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FROM_EMAIL=team@uselinky.app
```

### **Webhook Endpoint:**
```
https://jydldvvsxwosyzwttmui.supabase.co/functions/v1/stripe-webhook
```

### **Price IDs:**
- Founding Member: `price_live_...`
- Prospector: `price_live_...`
- Networker: `price_live_...`
- Rainmaker: `price_live_...`

---

## ✅ **SUCCESS CHECKLIST**

- [ ] Production Stripe keys configured
- [ ] Production webhook created and tested
- [ ] Price IDs updated in code
- [ ] Email templates updated
- [ ] Database backed up
- [ ] Code deployed to production
- [ ] All functionality tested
- [ ] Monitoring configured
- [ ] Support processes ready

---

**🎉 Congratulations! Your Linky application is now live in production!**

---

**📅 Created**: January 21, 2025  
**🔧 Version**: Production Transition v1.0  
**🎯 Status**: Ready for Production Launch 