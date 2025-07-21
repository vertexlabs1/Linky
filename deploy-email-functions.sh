#!/bin/bash

# Deployment script for Linky email functions with localhost URL fixes
# Run this script to deploy all updated email functions

echo "🚀 Deploying Linky Email Functions with Localhost URL Fixes..."
echo "=================================================="

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed or not in PATH"
    echo "Please install Supabase CLI first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/functions" ]; then
    echo "❌ This script must be run from the project root directory"
    echo "Make sure you're in the directory containing the 'supabase' folder"
    exit 1
fi

echo "✅ Supabase CLI found"
echo "✅ Project structure verified"
echo ""

# Deploy functions
echo "📧 Deploying send-welcome-email function..."
if supabase functions deploy send-welcome-email --no-verify-jwt; then
    echo "✅ send-welcome-email deployed successfully"
else
    echo "❌ Failed to deploy send-welcome-email"
    exit 1
fi

echo ""
echo "🔐 Deploying send-password-reset function..."
if supabase functions deploy send-password-reset --no-verify-jwt; then
    echo "✅ send-password-reset deployed successfully"
else
    echo "❌ Failed to deploy send-password-reset"
    exit 1
fi

echo ""
echo "👑 Deploying send-founding-member-email function..."
if supabase functions deploy send-founding-member-email --no-verify-jwt; then
    echo "✅ send-founding-member-email deployed successfully"
else
    echo "❌ Failed to deploy send-founding-member-email"
    exit 1
fi

echo ""
echo "🎉 All email functions deployed successfully!"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo "1. Test the functions using the admin panel"
echo "2. Check function logs for URL replacement messages"
echo "3. Verify emails contain https://www.uselinky.app URLs"
echo "4. Test the complete password setup flow"
echo ""
echo "🔍 To check function logs:"
echo "supabase functions logs send-welcome-email"
echo "supabase functions logs send-password-reset"
echo "supabase functions logs send-founding-member-email"
echo ""
echo "✅ Deployment complete! Localhost URL issue should now be resolved."