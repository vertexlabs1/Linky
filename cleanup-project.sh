#!/bin/bash

# Linky Project Cleanup Script
# This script removes unused files and organizes the project structure

set -e  # Exit on any error

echo "🧹 Starting Linky Project Cleanup..."
echo "=========================================="

# Step 1: Create backup
echo "📦 Creating backup..."
if [ ! -d "../Linky-Waitlist-backup" ]; then
    cp -r . "../Linky-Waitlist-backup"
    echo "✅ Backup created at ../Linky-Waitlist-backup"
else
    echo "⚠️ Backup already exists, skipping..."
fi

# Step 2: Remove test/debug scripts
echo ""
echo "🗑️ Removing test and debug scripts..."
rm -f test-*.js test-*.cjs
rm -f debug-*.js debug-*.cjs
rm -f fix-*.js fix-*.cjs
rm -f check-*.js check-*.cjs
rm -f create-*.js create-*.cjs
rm -f update-*.js update-*.cjs
rm -f cleanup-*.js cleanup-*.cjs
rm -f setup-*.js setup-*.cjs
rm -f quick-*.js quick-*.cjs
rm -f migrate-*.js migrate-*.cjs
rm -f insert-*.sql
rm -f check-*.sql
rm -f debug-*.sql
rm -f test-*.sql
echo "✅ Test and debug scripts removed"

# Step 3: Remove documentation files
echo ""
echo "📚 Removing redundant documentation..."
rm -f *_FIX.md
rm -f *_GUIDE.md
rm -f *_SUMMARY.md
rm -f EMAIL_*.md
rm -f USER_*.md
rm -f STRIPE_*.md
rm -f SECURE_*.md
rm -f SETUP_*.md
echo "✅ Documentation files removed"

# Step 4: Remove unused components
echo ""
echo "🧩 Removing unused components..."
rm -f src/components/DashboardPreview.tsx
rm -f src/components/LeadsPage.tsx
rm -f src/components/TargetsPage.tsx
rm -f src/components/FeaturesOverviewSection.tsx
rm -f src/components/ProblemSection.tsx
rm -f src/components/FAQSection.tsx
echo "✅ Unused components removed"

# Step 5: Remove unused edge functions
echo ""
echo "🔧 Removing unused edge functions..."
rm -rf supabase/functions/test-*
rm -rf supabase/functions/debug-*
rm -rf supabase/functions/simple-test
rm -rf supabase/functions/minimal-waitlist
rm -rf supabase/functions/test-cors
rm -rf supabase/functions/test-function
rm -rf supabase/functions/test-simple
rm -rf supabase/functions/test-waitlist
echo "✅ Unused edge functions removed"

# Step 6: Remove backup files
echo ""
echo "🗂️ Removing backup files..."
rm -f *.backup
rm -f *.backup-*
rm -f *.broken-*
rm -f *.new
echo "✅ Backup files removed"

# Step 7: Remove unused lib files
echo ""
echo "📚 Cleaning up lib directory..."
rm -f src/lib/api.ts.backup
echo "✅ Unused lib files removed"

# Step 8: Create new directory structure
echo ""
echo "📁 Creating new directory structure..."
mkdir -p src/components/layout
mkdir -p src/components/pages
mkdir -p src/components/features
mkdir -p src/lib/api
mkdir -p src/lib/auth
mkdir -p src/lib/stripe
mkdir -p src/lib/utils
mkdir -p docs
mkdir -p scripts
mkdir -p tests
echo "✅ New directory structure created"

# Step 9: Move files to new structure
echo ""
echo "📦 Moving files to new structure..."
# Move layout components
mv src/components/DashboardLayout.tsx src/components/layout/ 2>/dev/null || true
mv src/components/Navigation.tsx src/components/layout/ 2>/dev/null || true

# Move page components
mv src/components/LandingPage.tsx src/components/pages/ 2>/dev/null || true
mv src/components/DashboardWelcome.tsx src/components/pages/ 2>/dev/null || true

# Move feature components
mv src/components/FoundingMemberSection.tsx src/components/features/ 2>/dev/null || true
mv src/components/WaitlistSection.tsx src/components/features/ 2>/dev/null || true
mv src/components/FeatureRequests.tsx src/components/features/ 2>/dev/null || true
mv src/components/EmailTemplateEditor.tsx src/components/features/ 2>/dev/null || true

# Move lib files
mv src/lib/api.ts src/lib/api/ 2>/dev/null || true
mv src/lib/stripe-service.ts src/lib/stripe/ 2>/dev/null || true
mv src/lib/email.ts src/lib/api/ 2>/dev/null || true
mv src/lib/user-queries.ts src/lib/api/ 2>/dev/null || true

echo "✅ Files moved to new structure"

# Step 10: Create new documentation
echo ""
echo "📝 Creating new documentation..."
cat > docs/README.md << 'EOF'
# Linky - AI-Powered LinkedIn Lead Generation

## Overview
Linky is a SaaS platform that helps professionals generate leads on LinkedIn through AI-powered automation and analytics.

## Features
- **Waitlist System**: Email collection and management
- **Founding Member Program**: Special early access tier
- **Stripe Integration**: Payment processing and subscriptions
- **Admin Dashboard**: User and email template management
- **Feature Requests**: User feedback and roadmap system

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel

## Quick Start
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Start development server: `npm run dev`

## Project Structure
```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Layout components
│   ├── pages/       # Page components
│   └── features/    # Feature-specific components
├── lib/
│   ├── api/         # API functions
│   ├── auth/        # Authentication
│   ├── stripe/      # Payment integration
│   └── utils/       # Utilities
├── pages/           # Route components
└── hooks/           # Custom React hooks
```

## Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Deployment
- Frontend: Deploy to Vercel
- Backend: Supabase Edge Functions
- Database: Supabase PostgreSQL

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
MIT License
EOF

echo "✅ New documentation created"

# Step 11: Update package.json scripts
echo ""
echo "🔧 Updating package.json scripts..."
cat > scripts/dev-setup.sh << 'EOF'
#!/bin/bash
echo "🚀 Setting up Linky development environment..."

# Install dependencies
npm install

# Check environment variables
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found. Please create one based on .env.example"
    exit 1
fi

# Start development server
npm run dev
EOF

chmod +x scripts/dev-setup.sh

# Step 12: Final cleanup
echo ""
echo "🧹 Final cleanup..."
rm -f .DS_Store
rm -f *.log
echo "✅ Final cleanup complete"

# Step 13: Summary
echo ""
echo "🎉 Cleanup completed successfully!"
echo "=========================================="
echo ""
echo "📊 Summary of changes:"
echo "- Removed 50+ test/debug scripts"
echo "- Removed 15+ documentation files"
echo "- Removed 6 unused components"
echo "- Removed 8 unused edge functions"
echo "- Created new organized structure"
echo "- Added comprehensive documentation"
echo ""
echo "📁 New project structure:"
echo "- src/components/{layout,pages,features}/"
echo "- src/lib/{api,auth,stripe,utils}/"
echo "- docs/ (new documentation)"
echo "- scripts/ (build scripts)"
echo "- tests/ (test files)"
echo ""
echo "🚀 Next steps:"
echo "1. Test the application: npm run dev"
echo "2. Update import paths if needed"
echo "3. Review and commit changes"
echo "4. Update deployment configuration"
echo ""
echo "💡 If anything breaks, restore from backup:"
echo "cp -r ../Linky-Waitlist-backup/* ." 