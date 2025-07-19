#!/bin/bash
# Supabase Edge Functions Secrets Setup Script
# Run this to set up your Supabase Edge Functions with sandbox keys

echo "🔧 Setting up Supabase Edge Functions secrets..."

# Set Stripe secret key (sandbox)
echo "⚠️  Please add your Stripe secret key manually:"
echo "supabase secrets set STRIPE_SECRET_KEY=sk_test_your_sandbox_secret_key_here"

# Set Resend API key (you'll need to add your actual key)
echo "⚠️  Please add your Resend API key manually:"
echo "supabase secrets set RESEND_API_KEY=your_actual_resend_key_here"

# Set Supabase configuration
supabase secrets set SUPABASE_URL="https://jydldvvsxwosyzwttmui.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

echo "✅ Supabase secrets configured!"
echo ""
echo "📋 Next steps:"
echo "1. Add your Resend API key: supabase secrets set RESEND_API_KEY=your_key"
echo "2. Add your Supabase service role key: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key"
echo "3. Deploy Edge Functions: supabase functions deploy"
