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
