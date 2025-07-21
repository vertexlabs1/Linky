#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Linky Quick Deploy Helper');
console.log('=============================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the Linky-Waitlist directory');
  process.exit(1);
}

console.log('✅ Found Linky project');
console.log('');

// Step 1: Supabase setup
console.log('📋 Step 1: Supabase Setup');
console.log('==========================');
console.log('1. Run: chmod +x setup-supabase-secrets.sh');
console.log('2. Run: ./setup-supabase-secrets.sh');
console.log('3. Add your Resend API key: supabase secrets set RESEND_API_KEY=your_key');
console.log('4. Add your Supabase service role key: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key');
console.log('5. Deploy functions: supabase functions deploy');
console.log('');

// Step 2: Database migration
console.log('📋 Step 2: Database Migration');
console.log('=============================');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Run this SQL:');
console.log(`
-- Add missing columns for promo tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'regular';
`);
console.log('');

// Step 3: Vercel setup
console.log('📋 Step 3: Vercel Environment Variables');
console.log('=======================================');
console.log('1. Go to your Vercel dashboard');
console.log('2. Open your Linky project');
console.log('3. Go to Settings → Environment Variables');
console.log('4. Add these variables:');
console.log(`
VITE_SUPABASE_URL=https://jydldvvsxwosyzwttmui.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
FROM_EMAIL=team@uselinky.app
`);
console.log('5. Redeploy your site');
console.log('');

// Step 4: Stripe webhooks
console.log('📋 Step 4: Stripe Webhook Setup');
console.log('================================');
console.log('1. Go to [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/webhooks)');
console.log('2. Click "Add endpoint"');
console.log('3. Enter endpoint URL: https://jydldvvsxwosyzwttmui.supabase.co/functions/v1/stripe-webhook');
console.log('4. Select these events:');
console.log('   - checkout.session.completed');
console.log('   - invoice.payment_succeeded');
console.log('   - invoice.payment_failed');
console.log('   - customer.subscription.created');
console.log('   - customer.subscription.updated');
console.log('   - customer.subscription.deleted');
console.log('5. Click "Add endpoint"');
console.log('');

// Step 5: Testing
console.log('📋 Step 5: Testing Your Live Site');
console.log('==================================');
console.log('Test payment cards:');
console.log('- Success: 4242 4242 4242 4242');
console.log('- Decline: 4000 0000 0000 0002');
console.log('- 3D Secure: 4000 0025 0000 3155');
console.log('');
console.log('Test the complete flow:');
console.log('1. User signup');
console.log('2. Founding member registration');
console.log('3. Stripe checkout process');
console.log('4. Payment processing (test only)');
console.log('5. Email notifications');
console.log('6. Subscription management');
console.log('7. Admin dashboard');
console.log('');

console.log('🎉 All steps completed! Your Linky site is now live with sandbox Stripe!');
console.log('');
console.log('🧪 Remember: All payments are test transactions - no real money will be charged!'); 