import { supabase } from './supabase';

// User data queries with Row Level Security (RLS) protection

/**
 * Get current user's complete profile
 * RLS automatically restricts to user's own data
 */
export const getCurrentUserProfile = async () => {
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

/**
 * Get current user's subscription info
 * Only shows data for the authenticated user
 */
export const getUserSubscriptionInfo = async () => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      subscription_plan,
      subscription_status,
      subscription_type,
      stripe_customer_id,
      stripe_subscription_schedule_id,
      created_at
    `)
    .single();

  if (error) {
    console.error('Error fetching subscription info:', error);
    return null;
  }

  return data;
};

/**
 * Update user's profile information
 * RLS ensures users can only update their own data
 */
export const updateUserProfile = async (updates: {
  first_name?: string;
  last_name?: string;
  phone?: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

/**
 * Get basic info about other users (for team features)
 * RLS restricts to only basic, non-sensitive information
 */
export const getPublicUserInfo = async () => {
  const { data, error } = await supabase
    .from('public_user_info')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public user info:', error);
    return [];
  }

  return data;
};

/**
 * Check if user has access to specific features based on subscription
 */
export const checkUserAccess = async () => {
  const user = await getCurrentUserProfile();
  
  if (!user) return null;

  const hasFoundingMemberAccess = user.subscription_plan === 'founding_member';
  const hasProAccess = ['founding_member', 'pro', 'enterprise'].includes(user.subscription_plan);
  const isActiveSubscription = user.subscription_status === 'active';

  return {
    user,
    features: {
      foundingMemberFeatures: hasFoundingMemberAccess && isActiveSubscription,
      proFeatures: hasProAccess && isActiveSubscription,
      enterpriseFeatures: user.subscription_plan === 'enterprise' && isActiveSubscription,
      basicFeatures: user.status === 'active'
    }
  };
};

/**
 * Get user's payment and subscription history
 * Includes subscription schedule information for founding members
 */
export const getUserPaymentInfo = async () => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      stripe_customer_id,
      stripe_subscription_id,
      stripe_subscription_schedule_id,
      subscription_plan,
      subscription_status,
      subscription_type,
      created_at
    `)
    .single();

  if (error) {
    console.error('Error fetching payment info:', error);
    return null;
  }

  // Additional context for founding members
  if (data.subscription_type === 'founding_member_schedule') {
    return {
      ...data,
      isFoundingMember: true,
      hasSubscriptionSchedule: !!data.stripe_subscription_schedule_id,
      planDetails: 'Founding Member: $25 for 3 months, then $75/month'
    };
  }

  return data;
};

/**
 * Admin function to get user stats (only works with service role)
 * Regular users cannot access this due to RLS
 */
export const getUserStats = async () => {
  // This will only work if called from an admin context with service_role
  const { data, error } = await supabase
    .from('users')
    .select('subscription_plan, status')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }

  // Aggregate stats
  const stats = data.reduce((acc, user) => {
    acc.total += 1;
    acc.byPlan[user.subscription_plan] = (acc.byPlan[user.subscription_plan] || 0) + 1;
    return acc;
  }, { total: 0, byPlan: {} as Record<string, number> });

  return stats;
}; 