#!/usr/bin/env node

/**
 * 🧪 Linky Sandbox Setup Script
 * 
 * This script helps you configure Linky to use Stripe sandbox mode
 * for safe testing on your live site.
 */

const fs = require('fs');
const path = require('path');

// Sandbox configuration
const SANDBOX_CONFIG = {
  // Stripe Sandbox Keys (from your screenshot)
  STRIPE_PUBLISHABLE_KEY: 'your_stripe_publishable_key_here',
  STRIPE_SECRET_KEY: 'your_stripe_secret_key_here',
  
  // Supabase Configuration
  SUPABASE_URL: 'https://jydldvvsxwosyzwttmui.supabase.co',
  SUPABASE_ANON_KEY: 'your_supabase_anon_key_here',
  
  // Email Configuration
  FROM_EMAIL: 'team@uselinky.app'
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function createEnvFile() {
  log('📝 Creating .env file with sandbox configuration...', 'info');
  
  const envContent = `# Linky Sandbox Configuration
# This file contains environment variables for safe testing

# Supabase Configuration (Public Keys)
VITE_SUPABASE_URL=${SANDBOX_CONFIG.SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SANDBOX_CONFIG.SUPABASE_ANON_KEY}

# Stripe Configuration (SANDBOX KEYS - SAFE TESTING)
VITE_STRIPE_PUBLISHABLE_KEY=${SANDBOX_CONFIG.STRIPE_PUBLISHABLE_KEY}

# Email Configuration
FROM_EMAIL=${SANDBOX_CONFIG.FROM_EMAIL}

# Resend API Key (for email sending)
# Get this from: https://resend.com/api-keys
RESEND_API_KEY=your_resend_api_key_here

# Supabase Service Role Key (for backend operations)
# Get this from: Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Secret Key (for backend operations)
# This should be set in Supabase Edge Functions, not in frontend
STRIPE_SECRET_KEY=${SANDBOX_CONFIG.STRIPE_SECRET_KEY}
`;

  fs.writeFileSync('.env', envContent);
  log('✅ .env file created successfully!', 'success');
}

function createVercelConfig() {
  log('📝 Creating vercel.json for deployment...', 'info');
  
  const vercelConfig = {
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "framework": "vite",
    "installCommand": "npm install",
    "env": {
      "VITE_SUPABASE_URL": SANDBOX_CONFIG.SUPABASE_URL,
      "VITE_SUPABASE_ANON_KEY": SANDBOX_CONFIG.SUPABASE_ANON_KEY,
      "VITE_STRIPE_PUBLISHABLE_KEY": SANDBOX_CONFIG.STRIPE_PUBLISHABLE_KEY,
      "FROM_EMAIL": SANDBOX_CONFIG.FROM_EMAIL
    }
  };
  
  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  log('✅ vercel.json created successfully!', 'success');
}

function createSupabaseSecretsScript() {
  log('📝 Creating Supabase secrets setup script...', 'info');
  
  const secretsScript = `#!/bin/bash
# Supabase Edge Functions Secrets Setup Script
# Run this to set up your Supabase Edge Functions with sandbox keys

echo "🔧 Setting up Supabase Edge Functions secrets..."

# Set Stripe secret key (sandbox)
supabase secrets set STRIPE_SECRET_KEY="${SANDBOX_CONFIG.STRIPE_SECRET_KEY}"

# Set Resend API key (you'll need to add your actual key)
echo "⚠️  Please add your Resend API key manually:"
echo "supabase secrets set RESEND_API_KEY=your_actual_resend_key_here"

# Set Supabase configuration
supabase secrets set SUPABASE_URL="${SANDBOX_CONFIG.SUPABASE_URL}"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

echo "✅ Supabase secrets configured!"
echo ""
echo "📋 Next steps:"
echo "1. Add your Resend API key: supabase secrets set RESEND_API_KEY=your_key"
echo "2. Add your Supabase service role key: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key"
echo "3. Deploy Edge Functions: supabase functions deploy"
`;

  fs.writeFileSync('setup-supabase-secrets.sh', secretsScript);
  fs.chmodSync('setup-supabase-secrets.sh', '755');
  log('✅ Supabase secrets script created!', 'success');
}

function createDeploymentGuide() {
  log('📝 Creating deployment guide...', 'info');
  
  const guide = `# 🚀 Linky Sandbox Deployment Guide

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
   - \`VITE_SUPABASE_URL\`: ${SANDBOX_CONFIG.SUPABASE_URL}
   - \`VITE_SUPABASE_ANON_KEY\`: ${SANDBOX_CONFIG.SUPABASE_ANON_KEY}
   - \`VITE_STRIPE_PUBLISHABLE_KEY\`: ${SANDBOX_CONFIG.STRIPE_PUBLISHABLE_KEY}
   - \`FROM_EMAIL\`: ${SANDBOX_CONFIG.FROM_EMAIL}

### 2. Supabase Edge Functions
1. Run: \`chmod +x setup-supabase-secrets.sh\`
2. Run: \`./setup-supabase-secrets.sh\`
3. Add your Resend API key manually
4. Deploy functions: \`supabase functions deploy\`

### 3. Stripe Webhook Setup
1. Go to Stripe Dashboard (Test Mode)
2. Navigate to Developers → Webhooks
3. Add endpoint: \`https://your-project.supabase.co/functions/v1/stripe-webhook\`
4. Select events: \`checkout.session.completed\`, \`invoice.payment_succeeded\`, etc.

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
`;

  fs.writeFileSync('DEPLOYMENT_GUIDE.md', guide);
  log('✅ Deployment guide created!', 'success');
}

function main() {
  log('🧪 Linky Sandbox Setup', 'info');
  log('=====================================', 'info');
  
  try {
    createEnvFile();
    createVercelConfig();
    createSupabaseSecretsScript();
    createDeploymentGuide();
    
    log('', 'info');
    log('🎉 Sandbox setup completed successfully!', 'success');
    log('', 'info');
    log('📋 Next steps:', 'info');
    log('1. Update your .env file with your actual API keys', 'warning');
    log('2. Run: chmod +x setup-supabase-secrets.sh', 'info');
    log('3. Run: ./setup-supabase-secrets.sh', 'info');
    log('4. Deploy to Vercel with the new configuration', 'info');
    log('5. Test the complete flow safely!', 'success');
    
  } catch (error) {
    log(`❌ Error during setup: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SANDBOX_CONFIG }; 