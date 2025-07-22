// Admin Portal Types
export interface User {
  id: string;
  auth_user_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  email_verified: boolean;
  password_set: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: 'user' | 'admin' | 'founding_member';
  description?: string;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_session_id?: string;
  stripe_subscription_schedule_id?: string;
  plan_name: 'free' | 'founding_member' | 'prospector' | 'networker' | 'rainmaker';
  plan_type: 'monthly' | 'yearly' | 'founding_member';
  status: 'inactive' | 'active' | 'past_due' | 'cancelled' | 'unpaid' | 'trialing';
  amount_cents: number;
  currency: string;
  billing_cycle_start?: string;
  billing_cycle_end?: string;
  promo_active: boolean;
  promo_type?: string;
  promo_expiration_date?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscription {
  id: string;
  user_id?: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'pending';
  source: 'waitlist' | 'newsletter' | 'founding_member' | 'manual' | 'import';
  preferences: Record<string, any>;
  confirmed_at?: string;
  last_email_sent_at?: string;
  last_opened_at?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_trial' | 'founding_member';
  value?: number;
  currency: string;
  max_uses?: number;
  current_uses: number;
  starts_at: string;
  expires_at?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPromotion {
  id: string;
  user_id: string;
  promotion_id: string;
  subscription_id?: string;
  used_at: string;
  stripe_coupon_id?: string;
}

export interface StripeEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  event_data: Record<string, any>;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  newsletterSubscribers: number;
  foundingMembers: number;
  recentSignups: number;
  activePromos: number;
}

export interface AdminAction {
  id: string;
  type: 'resend_email' | 'reset_password' | 'grant_admin' | 'revoke_admin' | 'cancel_subscription' | 'reactivate_subscription' | 'change_plan' | 'unsubscribe' | 'replay_webhook';
  target_id: string;
  target_type: 'user' | 'subscription' | 'newsletter' | 'stripe_event';
  status: 'pending' | 'success' | 'error';
  message?: string;
  created_at: string;
} 