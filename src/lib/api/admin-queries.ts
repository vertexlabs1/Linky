import { supabase } from '../supabase';

export interface AdminDashboardData {
  waitlist: any[];
  foundingMembers: any[];
  emailTemplates: any[];
  stats: {
    totalWaitlist: number;
    totalFoundingMembers: number;
    totalTemplates: number;
    activeSubscriptions: number;
    pendingSubscriptions: number;
  };
}

export const loadAdminDashboardData = async (): Promise<AdminDashboardData> => {
  try {
    // Use a single RPC call to get all data at once
    const { data, error } = await supabase.rpc('get_admin_dashboard_data');
    
    if (error) {
      // Fallback to individual queries if RPC doesn't exist
      console.log('RPC not available, using individual queries...');
      return await loadAdminDashboardDataFallback();
    }
    
    return data;
  } catch (error) {
    console.error('Error loading admin dashboard data:', error);
    return await loadAdminDashboardDataFallback();
  }
};

const loadAdminDashboardDataFallback = async (): Promise<AdminDashboardData> => {
  // Load all data in parallel
  const [waitlistResult, foundingMembersResult, templatesResult, statsResult] = await Promise.all([
    // Waitlist data
    supabase
      .from('active_subscribers')
      .select('*')
      .order('created_at', { ascending: false }),
    
    // Founding members data
    supabase
      .from('users')
      .select('*')
      .eq('founding_member', true)
      .order('created_at', { ascending: false }),
    
    // Email templates
    supabase
      .from('email_templates')
      .select('*')
      .order('updated_at', { ascending: false }),
    
    // Stats
    supabase
      .from('users')
      .select('subscription_status, founding_member')
  ]);
  
  const waitlist = waitlistResult.data || [];
  const foundingMembers = foundingMembersResult.data || [];
  const emailTemplates = templatesResult.data || [];
  
  // Calculate stats
  const stats = {
    totalWaitlist: waitlist.length,
    totalFoundingMembers: foundingMembers.length,
    totalTemplates: emailTemplates.length,
    activeSubscriptions: statsResult.data?.filter(u => u.subscription_status === 'active').length || 0,
    pendingSubscriptions: statsResult.data?.filter(u => u.subscription_status === 'pending').length || 0,
  };
  
  return {
    waitlist,
    foundingMembers,
    emailTemplates,
    stats
  };
};

export const updateUserSubscription = async (userId: string, updates: {
  subscription_plan?: string;
  subscription_status?: string;
  founding_member?: boolean;
}) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const batchUpdateUsers = async (updates: Array<{
  id: string;
  subscription_plan?: string;
  subscription_status?: string;
  founding_member?: boolean;
}>) => {
  // Use a transaction to update multiple users atomically
  const { data, error } = await supabase.rpc('batch_update_users', {
    user_updates: updates
  });
  
  if (error) {
    // Fallback to individual updates
    const results = await Promise.all(
      updates.map(update => updateUserSubscription(update.id, update))
    );
    return results;
  }
  
  return data;
}; 