import stripePromise from '../stripe';

export interface CreateCheckoutSessionParams {
  priceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
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

// PRODUCTION STRIPE PRICE IDS - Updated for bulletproof billing
export const PRICE_IDS = {
  // Founding Member pricing - $25 for 3 months via subscription schedule
  FOUNDING_MEMBER: 'price_1RmIXSK06fIw6v4hj3rTDsRj', // $25 every 3 months (1 iteration only)
  
  // Regular subscription tiers
  PROSPECTOR: 'price_1RmIR6K06fIw6v4hEoGab0Ts', // $75/month 
  NETWORKER: 'price_1RmIR6K06fIw6v4hT68Bm0ST', // $145/month
  RAINMAKER: 'price_1RmIR7K06fIw6v4h5ovxqVqW', // $199/month
} as const;

// Plan tier mapping with complete information
export const PLAN_TIERS = {
  PROSPECTOR: {
    id: 'prospector',
    name: 'Prospector',
    price: 75,
    priceId: PRICE_IDS.PROSPECTOR,
    description: 'Perfect for individual professionals',
    emoji: '🥉',
    color: 'blue',
    features: [
      '5 LinkedIn Profiles Monitored',
      '100 Profiles Tracked', 
      'AI Lead Scoring',
      'Basic Analytics',
      'Email Support'
    ],
    limits: {
      profiles_monitored: 5,
      profiles_tracked: 100,
      ai_credits: 1000
    }
  },
  NETWORKER: {
    id: 'networker',
    name: 'Networker', 
    price: 145,
    priceId: PRICE_IDS.NETWORKER,
    description: 'Ideal for growing teams',
    emoji: '🥈',
    color: 'purple',
    features: [
      '10 LinkedIn Profiles Monitored',
      '300 Profiles Tracked',
      'Advanced AI Research', 
      'Email Automation',
      'Team Collaboration',
      'Priority Support'
    ],
    limits: {
      profiles_monitored: 10,
      profiles_tracked: 300,
      ai_credits: 3000
    }
  },
  RAINMAKER: {
    id: 'rainmaker',
    name: 'Rainmaker',
    price: 199,
    priceId: PRICE_IDS.RAINMAKER,
    description: 'For sales teams and agencies',
    emoji: '🥇',
    color: 'gold',
    features: [
      '20 LinkedIn Profiles Monitored',
      '500 Profiles Tracked',
      'Custom Integrations',
      'Advanced Analytics',
      'White-label Options',
      'Dedicated Success Manager'
    ],
    limits: {
      profiles_monitored: 20,
      profiles_tracked: 500,
      ai_credits: 10000
    }
  },
  FOUNDING_MEMBER: {
    id: 'founding_member',
    name: 'Founding Member',
    price: 25, // Special founding member price
    priceId: PRICE_IDS.FOUNDING_MEMBER,
    description: '$25 for 3 months, then $75/month',
    emoji: '👑',
    color: 'yellow',
    features: [
      'All Prospector Features',
      'Founding Member Badge',
      'Lifetime 50% Discount',
      'Early Access to New Features',
      'Direct Founder Access'
    ],
    limits: {
      profiles_monitored: 5,
      profiles_tracked: 100,
      ai_credits: 1000
    }
  }
} as const;

// Plan order for upgrades/downgrades
export const PLAN_HIERARCHY = ['prospector', 'networker', 'rainmaker'] as const;

// Helper functions for plan management
export function getPlanByPriceId(priceId: string) {
  const planEntry = Object.entries(PLAN_TIERS).find(([_, plan]) => plan.priceId === priceId);
  return planEntry ? planEntry[1] : PLAN_TIERS.PROSPECTOR; // Default fallback
}

export function getPlanById(planId: string) {
  const normalizedId = planId.toLowerCase();
  switch (normalizedId) {
    case 'prospector':
      return PLAN_TIERS.PROSPECTOR;
    case 'networker':
      return PLAN_TIERS.NETWORKER;
    case 'rainmaker':
      return PLAN_TIERS.RAINMAKER;
    case 'founding_member':
      return PLAN_TIERS.FOUNDING_MEMBER;
    default:
      return PLAN_TIERS.PROSPECTOR;
  }
}

export function getPriceIdForPlan(planName: string): string {
  const normalizedName = planName.toLowerCase().replace(/\s+/g, '_');
  switch (normalizedName) {
    case 'prospector':
      return PRICE_IDS.PROSPECTOR;
    case 'networker':
      return PRICE_IDS.NETWORKER;
    case 'rainmaker':
      return PRICE_IDS.RAINMAKER;
    case 'founding_member':
      return PRICE_IDS.FOUNDING_MEMBER;
    default:
      return PRICE_IDS.PROSPECTOR;
  }
}

export function getPlanNameFromPriceId(priceId: string): string {
  switch (priceId) {
    case PRICE_IDS.PROSPECTOR:
      return 'Prospector';
    case PRICE_IDS.NETWORKER:
      return 'Networker';
    case PRICE_IDS.RAINMAKER:
      return 'Rainmaker';
    case PRICE_IDS.FOUNDING_MEMBER:
      return 'Founding Member';
    default:
      return 'Prospector';
  }
}

export function getAvailableUpgrades(currentPlan: string): typeof PLAN_TIERS[keyof typeof PLAN_TIERS][] {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan.toLowerCase() as any);
  if (currentIndex === -1) return Object.values(PLAN_TIERS);
  
  return PLAN_HIERARCHY.slice(currentIndex + 1).map(planId => getPlanById(planId));
}

export function getAvailableDowngrades(currentPlan: string): typeof PLAN_TIERS[keyof typeof PLAN_TIERS][] {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan.toLowerCase() as any);
  if (currentIndex === -1) return [];
  
  return PLAN_HIERARCHY.slice(0, currentIndex).map(planId => getPlanById(planId));
}

export function isUpgrade(fromPlan: string, toPlan: string): boolean {
  const fromIndex = PLAN_HIERARCHY.indexOf(fromPlan.toLowerCase() as any);
  const toIndex = PLAN_HIERARCHY.indexOf(toPlan.toLowerCase() as any);
  return toIndex > fromIndex;
}

export function isDowngrade(fromPlan: string, toPlan: string): boolean {
  const fromIndex = PLAN_HIERARCHY.indexOf(fromPlan.toLowerCase() as any);
  const toIndex = PLAN_HIERARCHY.indexOf(toPlan.toLowerCase() as any);
  return toIndex < fromIndex;
}

// Calculate proration for plan changes
export function calculateProration(
  fromPlan: string, 
  toPlan: string, 
  daysRemainingInPeriod: number,
  totalDaysInPeriod: number = 30
): number {
  const fromPrice = getPlanById(fromPlan).price;
  const toPrice = getPlanById(toPlan).price;
  const unusedAmount = (fromPrice / totalDaysInPeriod) * daysRemainingInPeriod;
  const newAmount = (toPrice / totalDaysInPeriod) * daysRemainingInPeriod;
  return Math.max(0, newAmount - unusedAmount);
}

// Format price for display (assumes price is in cents)
export function formatPrice(price: number): string {
  return `$${(price / 100).toFixed(2)}`;
}

// Format plan display name
export function formatPlanName(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
}

// Subscription status helpers
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  PAUSED: 'paused'
} as const;

export function getStatusColor(status: string): string {
  switch (status) {
    case SUBSCRIPTION_STATUSES.ACTIVE:
    case SUBSCRIPTION_STATUSES.TRIALING:
      return 'green';
    case SUBSCRIPTION_STATUSES.PAST_DUE:
    case SUBSCRIPTION_STATUSES.INCOMPLETE:
      return 'yellow';
    case SUBSCRIPTION_STATUSES.CANCELED:
    case SUBSCRIPTION_STATUSES.UNPAID:
    case SUBSCRIPTION_STATUSES.INCOMPLETE_EXPIRED:
      return 'red';
    case SUBSCRIPTION_STATUSES.PAUSED:
      return 'gray';
    default:
      return 'gray';
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case SUBSCRIPTION_STATUSES.ACTIVE:
      return '✅';
    case SUBSCRIPTION_STATUSES.TRIALING:
      return '🆓';
    case SUBSCRIPTION_STATUSES.PAST_DUE:
      return '⚠️';
    case SUBSCRIPTION_STATUSES.CANCELED:
      return '❌';
    case SUBSCRIPTION_STATUSES.UNPAID:
      return '🚫';
    case SUBSCRIPTION_STATUSES.PAUSED:
      return '⏸️';
    case SUBSCRIPTION_STATUSES.INCOMPLETE:
      return '⏳';
    default:
      return '❓';
  }
}

// Validate plan change
export function validatePlanChange(fromPlan: string, toPlan: string): { valid: boolean; reason?: string } {
  if (fromPlan === toPlan) {
    return { valid: false, reason: 'Cannot change to the same plan' };
  }
  
  const fromPlanData = getPlanById(fromPlan);
  const toPlanData = getPlanById(toPlan);
  
  if (!fromPlanData || !toPlanData) {
    return { valid: false, reason: 'Invalid plan specified' };
  }
  
  return { valid: true };
} 