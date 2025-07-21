import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  User, 
  Subscription, 
  NewsletterSubscription, 
  Promotion, 
  StripeEvent, 
  PaginatedResponse,
  AdminStats 
} from '../types';

// Generic paginated query hook
export const usePaginatedQuery = <T>(
  key: string,
  table: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: Record<string, any>
) => {
  return useQuery({
    queryKey: [key, page, pageSize, filters],
    queryFn: async (): Promise<PaginatedResponse<T>> => {
      let query = supabase
        .from(table)
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    }
  });
};

// Users
export const useUsers = (page: number = 1, filters?: Record<string, any>) => {
  return usePaginatedQuery<User>('users', 'users', page, 20, filters);
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });
};

// Subscriptions
export const useSubscriptions = (page: number = 1, filters?: Record<string, any>) => {
  return usePaginatedQuery<Subscription>('subscriptions', 'subscriptions', page, 20, filters);
};

export const useSubscription = (id: string) => {
  return useQuery({
    queryKey: ['subscription', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });
};

// Newsletter Subscriptions
export const useNewsletterSubscriptions = (page: number = 1, filters?: Record<string, any>) => {
  return usePaginatedQuery<NewsletterSubscription>('newsletter_subscriptions', 'newsletter_subscriptions', page, 20, filters);
};

// Promotions
export const usePromotions = (page: number = 1, filters?: Record<string, any>) => {
  return usePaginatedQuery<Promotion>('promotions', 'promotions', page, 20, filters);
};

// Stripe Events
export const useStripeEvents = (page: number = 1, filters?: Record<string, any>) => {
  return usePaginatedQuery<StripeEvent>('stripe_events', 'stripe_events', page, 20, filters);
};

// Admin Stats
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total revenue (sum of all subscription amounts)
      const { data: revenueData } = await supabase
        .from('subscriptions')
        .select('amount_cents')
        .eq('status', 'active');

      const totalRevenue = revenueData?.reduce((sum, sub) => sum + (sub.amount_cents || 0), 0) || 0;

      // Get newsletter subscribers
      const { count: newsletterSubscribers } = await supabase
        .from('newsletter_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get founding members
      const { count: foundingMembers } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('plan_name', 'founding_member')
        .eq('status', 'active');

      // Get recent signups (last 7 days)
      const { count: recentSignups } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      return {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalRevenue,
        newsletterSubscribers: newsletterSubscribers || 0,
        foundingMembers: foundingMembers || 0,
        recentSignups: recentSignups || 0
      };
    }
  });
};

// Mutations
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Subscription> }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
};

export const useGrantRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      const { data, error } = await supabase
        .rpc('grant_user_role', { 
          user_uuid: userId, 
          role_name: roleName 
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

export const useRevokeRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      const { data, error } = await supabase
        .rpc('revoke_user_role', { 
          user_uuid: userId, 
          role_name: roleName 
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

export const useResendEmail = () => {
  return useMutation({
    mutationFn: async ({ email, type }: { email: string; type: 'welcome' | 'founding_member' | 'password_reset' }) => {
      const { data, error } = await supabase.functions.invoke(`send-${type}-email`, {
        body: { email }
      });

      if (error) throw error;
      return data;
    }
  });
};

export const useReplayWebhook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const { data, error } = await supabase.functions.invoke('stripe-webhook', {
        body: { event_id: eventId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe_events'] });
    }
  });
}; 