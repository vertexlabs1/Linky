import { supabase } from '../supabase';

// API service for calling Supabase Edge Functions
export const api = {
  // Email functions
  async sendWelcomeEmail(email: string, name?: string) {
    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: { email, name }
    });
    
    if (error) throw error;
    return data;
  },

  // Waitlist functions
  async addToWaitlist(params: {
    email: string;
    firstName?: string;
    lastName?: string;
  }) {
    const { data, error } = await supabase.functions.invoke('add-to-waitlist', {
      body: params
    });
    
    if (error) throw error;
    return data;
  },

  async sendFoundingMemberEmail(email: string, firstName: string, lastName: string, sessionId: string) {
    const { data, error } = await supabase.functions.invoke('send-founding-member-email', {
      body: { email, firstName, lastName, sessionId }
    });
    
    if (error) throw error;
    return data;
  },

  // Stripe functions
  async createCheckoutSession(params: {
    priceId: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    phone?: string;
  }) {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: params
    });
    
    if (error) throw error;
    return data;
  },

  async createFoundingMemberSchedule(params: {
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    phone?: string;
  }) {
    const { data, error } = await supabase.functions.invoke('create-founding-member-schedule', {
      body: params
    });
    
    if (error) throw error;
    return data;
  },

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { customerId, returnUrl }
    });
    
    if (error) throw error;
    return data;
  },

  async createUser(params: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    status?: string;
    founding_member?: boolean;
  }) {
    // First, check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, status, stripe_customer_id')
      .eq('email', params.email)
      .single();

    if (existingUser) {
      console.log('User already exists:', existingUser);
      
      // If user exists but hasn't paid yet, update their info and return
      if (existingUser.status === 'pending' && !existingUser.stripe_customer_id) {
        console.log('Updating existing pending user');
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            first_name: params.first_name,
            last_name: params.last_name,
            phone: params.phone || null,
            founding_member: params.founding_member ?? true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select('id')
          .single();
        
        if (updateError) throw updateError;
        return updatedUser;
      }
      
      // If user has already paid, throw error
      if (existingUser.status === 'active' || existingUser.stripe_customer_id) {
        throw new Error('User already has an active account. Please sign in instead.');
      }
      
      // For any other status, return existing user
      return existingUser;
    }

    // Create new user if none exists
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: params.email,
        first_name: params.first_name,
        last_name: params.last_name,
        phone: params.phone || null,
        status: params.status || 'pending',
        founding_member: params.founding_member ?? true,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data;
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }
}; 

// Admin Dashboard API functions
export const sendWelcomeEmail = async (email: string, firstName: string) => {
  const response = await fetch('/api/send-welcome-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, firstName })
  })
  
  if (!response.ok) {
    throw new Error('Failed to send welcome email')
  }
  
  return response.json()
}

export const sendFoundingMemberEmail = async (email: string, firstName: string, sessionId: string) => {
  const response = await fetch('/api/send-founding-member-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, firstName, sessionId })
  })
  
  if (!response.ok) {
    throw new Error('Failed to send founding member email')
  }
  
  return response.json()
}

export const sendPasswordReset = async (email: string) => {
  const response = await fetch('/api/send-password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  
  if (!response.ok) {
    throw new Error('Failed to send password reset')
  }
  
  return response.json()
}

export const updateEmailTemplate = async (templateId: string, updates: {
  subject?: string
  html_content?: string
}) => {
  const { data, error } = await supabase
    .from('email_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .select()

  if (error) throw error
  return data
} 
