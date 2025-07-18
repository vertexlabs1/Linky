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
