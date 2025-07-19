# 🚀 Linky Sandbox Deployment Guide

## Overview
This guide will help you deploy Linky with Stripe sandbox mode for safe testing on your live site.

## ✅ What's Configured
- ✅ Stripe sandbox keys (no real money)
- ✅ Supabase configuration
- ✅ Environment variables
- ✅ Safe testing environment

## 📋 Deployment Steps

### 1. Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add these environment variables in Vercel:
   - `VITE_SUPABASE_URL`: https://jydldvvsxwosyzwttmui.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTgwNTAsImV4cCI6MjA2ODI3NDA1MH0.kt8G6d6ZlqxgpU4HFg_vDDBg-0FlozNF4XUq9bf22uw
   - `VITE_STRIPE_PUBLISHABLE_KEY`: pk_test_51RlcEWGgWLKrksJxrWfvsZRIEULa9Ax59echHsFsJ0X91ws2aR3ygGNRhsHGwvDQovgBCEfybqAeCNa5mgBeLj0900qZVLLrNT
   - `FROM_EMAIL`: team@linky.app

### 2. Supabase Edge Functions
1. Run: `chmod +x setup-supabase-secrets.sh`
2. Run: `./setup-supabase-secrets.sh`
3. Add your Resend API key manually
4. Deploy functions: `supabase functions deploy`

### 3. Stripe Webhook Setup
1. Go to Stripe Dashboard (Test Mode)
2. Navigate to Developers → Webhooks
3. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, etc.

## 🧪 Testing
- All payments will be test transactions
- No real money will be charged
- You can safely test the complete flow
- Test data can be deleted from Stripe dashboard

## 🔄 Switching to Production
When ready for production:
1. Update environment variables to live Stripe keys
2. Update webhook endpoints to production URLs
3. Test thoroughly before going live

## 📞 Support
If you need help, check the documentation or reach out to the team.
