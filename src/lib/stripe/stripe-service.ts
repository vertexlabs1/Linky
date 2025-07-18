import stripePromise from '../stripe';

export interface CreateCheckoutSessionParams {
  priceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export const createCheckoutSession = async (params: CreateCheckoutSessionParams) => {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    const session = await stripe.redirectToCheckout({
      lineItems: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      customerEmail: params.customerEmail,
    });

    if (session.error) {
      throw new Error(session.error.message);
    }

    return session;
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
};

export const createCustomerPortalSession = async (customerId: string, returnUrl: string) => {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl,
      }),
    });

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Portal session error:', error);
    throw error;
  }
};

// Updated Price IDs for different plans based on your Stripe setup
export const PRICE_IDS = {
  // Founding Member pricing (subscription schedule: $25 for 3 months, then auto-upgrade)
  FOUNDING_MEMBER_PERIOD: 'price_1RmIXSK06fIw6v4hj3rTDsRj', // $25 every 3 months (1 iteration only)
  
  // Regular subscription tiers (post-founding member or direct signups)
  PROSPECTOR: 'price_1RmIR6K06fIw6v4hEoGab0Ts', // $75/month 
  NETWORKER: 'price_1RmIR6K06fIw6v4hT68Bm0ST', // $145/month
  RAINMAKER: 'price_1RmIR7K06fIw6v4h5ovxqVqW', // $199/month
  
  // Legacy (keeping for backward compatibility)
  FOUNDING_MEMBER: 'price_1RmIXSK06fIw6v4hj3rTDsRj', // Same as founding member period
  PRO: 'price_1RmIR6K06fIw6v4hEoGab0Ts', // Same as Prospector
  ENTERPRISE: 'price_1RmIR7K06fIw6v4h5ovxqVqW', // Same as Rainmaker
} as const;

// Plan tier mapping for easy reference
export const PLAN_TIERS = {
  PROSPECTOR: {
    name: 'Prospector',
    price: 75,
    priceId: 'price_1Rlz4pGgWLKrksJxExadkxnL',
    description: 'Perfect for individual professionals',
    emoji: '🥉',
    features: ['5 LinkedIn Profiles Monitored', '100 Profiles Tracked', 'AI Lead Scoring', 'Basic Analytics']
  },
  NETWORKER: {
    name: 'Networker', 
    price: 145,
    priceId: 'price_1RmF4zGgWLKrksJxXKJHSCcP',
    description: 'Ideal for growing teams',
    emoji: '🥈',
    features: ['10 LinkedIn Profiles Monitored', '300 Profiles Tracked', 'Advanced AI Research', 'Email Automation']
  },
  RAINMAKER: {
    name: 'Rainmaker',
    price: 199,
    priceId: 'price_1RmF5JGgWLKrksJxJxtSwTZ4Ta',
    description: 'For sales teams and agencies',
    emoji: '🥇', 
    features: ['20 LinkedIn Profiles Monitored', '500 Profiles Tracked', 'Custom Integrations', 'Priority Support']
  }
} as const;

// Helper function to get plan info by price ID
export function getPlanByPriceId(priceId: string) {
  switch (priceId) {
    case PRICE_IDS.PROSPECTOR:
      return PLAN_TIERS.PROSPECTOR;
    case PRICE_IDS.NETWORKER:
      return PLAN_TIERS.NETWORKER;
    case PRICE_IDS.RAINMAKER:
      return PLAN_TIERS.RAINMAKER;
    default:
      return PLAN_TIERS.PROSPECTOR; // Default fallback
  }
} 