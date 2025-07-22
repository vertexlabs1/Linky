import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Crown, 
  User, 
  Mail, 
  Phone, 
  CreditCard,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Clock,
  HelpCircle,
  Send,
  Key,
  DollarSign,
  ExternalLink,
  Copy,
  Shield,
  Activity,
  Edit,
  Receipt,
  Gift,
  X
} from 'lucide-react';
import { getPlanById, getStatusIcon, getStatusColor, formatPrice } from '../../lib/stripe/stripe-service';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
  job_title?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_plan: string;
  subscription_status: string;
  current_plan_id?: string;
  current_period_end?: string;
  founding_member?: boolean;
  founding_member_purchased_at?: string;
  founding_member_transition_date?: string;
  founding_member_transitioned_at?: string;
  founding_member_original_plan_id?: string;
  founding_member_transition_plan_id?: string;
  is_admin?: boolean;
  status: string;
  last_sync_at?: string;
  created_at: string;
  billing_name?: string;
  billing_email?: string;
  billing_phone?: string;
  promo_active?: boolean;
  promo_type?: string;
  promo_expiration_date?: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string;
  stripe_payment_intent_id?: string;
  receipt_url?: string;
}

interface PaymentMethod {
  id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

interface ActivityHistory {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
  admin_email?: string;
  admin_name?: string;
  old_values?: any;
  new_values?: any;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admins' | 'founding_members' | 'active' | 'inactive'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);

  // New state for comprehensive user profile
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [userPaymentMethods, setUserPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPasswordReset, setLoadingPasswordReset] = useState(false);
  const [loadingUserEdit, setLoadingUserEdit] = useState(false);
  const [loadingStripeSync, setLoadingStripeSync] = useState(false);
  const [loadingBillingEdit, setLoadingBillingEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    status: '',
    is_admin: false,
    founding_member: false
  });

  // Activity history state
  const [activityHistory, setActivityHistory] = useState<ActivityHistory[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Customer service modal states
  const [showBillingUpdate, setShowBillingUpdate] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSubscriptionChange, setShowSubscriptionChange] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [promoForm, setPromoForm] = useState({
    type: '',
    duration_days: 90,
    notes: ''
  });
  const [loadingPromo, setLoadingPromo] = useState(false);

  // Enhanced billing state management
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [billingSameAsAccount, setBillingSameAsAccount] = useState(false);
  const [billingForm, setBillingForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });

  // Create user form state
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    job_title: '',
    subscription_plan: 'prospector',
    status: 'active',
    is_admin: false,
    founding_member: false
  });

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open user profile when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setSelectedUser(user);
        setShowUserProfile(true);
        fetchUserTransactions(user.id);
        fetchActivityHistory(user.id); // Fetch activity history for the selected user
      }
    }
  }, [selectedUserId, users]);

  const handleEditChange = (field: keyof User, value: any) => {
    if (editUser) {
      setEditUser({ ...editUser, [field]: value });
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editUser.first_name,
          last_name: editUser.last_name,
          email: editUser.email,
          status: editUser.status,
          is_admin: editUser.is_admin
        })
        .eq('id', editUser.id);

      if (error) throw error;

      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUserId(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      setLoadingUserEdit(true);
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone,
          company: editForm.company,
          job_title: editForm.job_title,
          status: editForm.status,
          is_admin: editForm.is_admin,
          founding_member: editForm.founding_member,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('User updated successfully');
      setIsEditing(false);
      fetchUsers(); // Refresh the users list
      
      // Update the selected user with new data
      const updatedUser = { ...selectedUser, ...editForm };
      setSelectedUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoadingUserEdit(false);
    }
  };

  const startEditing = () => {
    if (selectedUser) {
      setEditForm({
        first_name: selectedUser.first_name || '',
        last_name: selectedUser.last_name || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        company: selectedUser.company || '',
        job_title: selectedUser.job_title || '',
        status: selectedUser.status || '',
        is_admin: selectedUser.is_admin || false,
        founding_member: selectedUser.founding_member || false
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTransactions = async (userId: string) => {
    try {
      setLoadingTransactions(true);
      console.log('🔄 Fetching transactions for user:', userId);
      
      // Fetch both transactions and payment methods
      const [transactionsResult, paymentMethodsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ]);

      if (transactionsResult.error) {
        console.error('❌ Database error:', transactionsResult.error);
        throw transactionsResult.error;
      }
      
      console.log('📊 Found transactions in database:', transactionsResult.data?.length || 0);
      setUserTransactions(transactionsResult.data || []);
      
      if (paymentMethodsResult.error) {
        console.error('❌ Error fetching payment methods:', paymentMethodsResult.error);
      } else {
        setUserPaymentMethods(paymentMethodsResult.data || []);
        console.log('💳 Found payment methods:', paymentMethodsResult.data?.length || 0);
      }
      
      // If we have data, use it
      if (transactionsResult.data && transactionsResult.data.length > 0) {
        console.log(`📊 Found ${transactionsResult.data.length} transactions in database`);
        return;
      }

      // If no local data and user has Stripe customer, sync from Stripe
      const user = users.find(u => u.id === userId);
      console.log('👤 User found:', user?.email, 'Stripe customer ID:', user?.stripe_customer_id);
      
      if (user?.stripe_customer_id) {
        console.log('🔄 Syncing from Stripe...');
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-payment-history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            userEmail: user.email
          })
        });

        console.log('📡 Stripe sync response status:', response.status);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Stripe sync successful:', responseData);
          
          // Fetch again after sync
          const { data: syncedData, error: syncError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!syncError) {
            console.log('📊 Synced transactions:', syncedData?.length || 0);
            setUserTransactions(syncedData || []);
          } else {
            console.error('❌ Error fetching synced data:', syncError);
            toast.error('Failed to fetch synced transactions');
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Stripe sync failed:', response.status, errorText);
          toast.error('Failed to sync payment history from Stripe');
        }
              } else {
          console.log('⚠️ No Stripe customer ID found');
          setUserTransactions([]);
        }
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      toast.error('Failed to fetch payment history');
      setUserTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const sendWelcomeEmail = async (email: string, firstName: string, isFoundingMember: boolean = false) => {
    try {
      setLoadingEmail(true);
      
      // Choose the appropriate endpoint based on user type
      const endpoint = isFoundingMember ? 'send-founding-member-email' : 'send-welcome-email';
      const emailType = isFoundingMember ? 'Founding Member' : 'Welcome';
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ 
          email, 
          firstName,
          source: 'admin_dashboard'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${response.status} ${errorText}`);
      }
      
      toast.success(`${emailType} email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Failed to send email: ${error.message}`);
    } finally {
      setLoadingEmail(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      setLoadingPasswordReset(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send password reset: ${response.status} ${errorText}`);
      }
      
      toast.success(`Password reset sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error(`Failed to send password reset: ${error.message}`);
    } finally {
      setLoadingPasswordReset(false);
    }
  };

  const createUser = async (userData: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone || null,
          company: userData.company || null,
          job_title: userData.job_title || null,
          subscription_plan: userData.subscription_plan,
          status: userData.status,
          is_admin: userData.is_admin,
          founding_member: userData.founding_member
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('User created successfully');
      setShowCreateUser(false);
      setNewUser({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        company: '',
        job_title: '',
        subscription_plan: 'prospector',
        status: 'active',
        is_admin: false,
        founding_member: false
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const getSubscriptionBadgeColor = (plan: string) => {
    switch (plan) {
      case 'prospector': return 'bg-blue-100 text-blue-800';
      case 'rainmaker': return 'bg-purple-100 text-purple-800';
      case 'founding_member': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (user: User) => {
    // Admin users who can log in should show as Active
    if (user.is_admin && user.status === 'active') {
      return { text: 'Active', color: 'text-green-600', icon: <CheckCircle className="w-3 h-3" /> };
    }
    
    // Users who have paid but haven't set password
    if (user.founding_member && user.status === 'inactive') {
      return { text: 'Paid, Account Not Created', color: 'text-orange-600', icon: <AlertTriangle className="w-3 h-3" /> };
    }
    
    // Regular status mapping
    switch (user.status) {
      case 'active':
        return { text: 'Active', color: 'text-green-600', icon: <CheckCircle className="w-3 h-3" /> };
      case 'inactive':
        return { text: 'Inactive', color: 'text-red-600', icon: <XCircle className="w-3 h-3" /> };
      case 'pending':
        return { text: 'Pending', color: 'text-blue-600', icon: <Clock className="w-3 h-3" /> };
      default:
        return { text: 'Unknown', color: 'text-gray-600', icon: <HelpCircle className="w-3 h-3" /> };
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (debouncedSearchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    switch (filterType) {
      case 'admins':
        filtered = filtered.filter(user => user.is_admin);
        break;
      case 'founding_members':
        filtered = filtered.filter(user => user.founding_member);
        break;
      case 'active':
        filtered = filtered.filter(user => user.status === 'active');
        break;
      case 'inactive':
        filtered = filtered.filter(user => user.status === 'inactive');
        break;
    }

    return filtered;
  }, [users, debouncedSearchTerm, filterType]);

  const exportUsers = () => {
    const csvContent = [
      ['Email', 'Name', 'Role', 'Subscription', 'Status', 'Joined'],
      ...filteredUsers.map(user => [
        user.email,
        `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
        user.is_admin ? 'Admin' : 'User',
        user.subscription_plan || 'Free',
        user.status,
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSyncWithStripe = async () => {
    if (!selectedUser) return;

    try {
      setLoadingStripeSync(true);
      const { error } = await supabase
        .from('users')
        .update({
          last_sync_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('User synced with Stripe successfully');
      fetchUsers(); // Refresh the users list to show the updated last_sync_at
    } catch (error: any) {
      console.error('Error syncing with Stripe:', error);
      toast.error('Failed to sync with Stripe');
    } finally {
      setLoadingStripeSync(false);
    }
  };



  // Enhanced billing management functions
  const startBillingEdit = () => {
    if (!selectedUser) return;
    
    // Initialize billing form with current values or account values
    setBillingForm({
      name: selectedUser.billing_name || `${selectedUser.first_name} ${selectedUser.last_name}`,
      email: selectedUser.billing_email || selectedUser.email,
      phone: selectedUser.billing_phone || selectedUser.phone || '',
      address: '', // Will be parsed from billing_address JSON
      city: '',
      state: '',
      zip: '',
      country: 'US'
    });

    // Check if billing is same as account
    const isSame = !selectedUser.billing_name && !selectedUser.billing_email && !selectedUser.billing_phone;
    setBillingSameAsAccount(isSame);

    setIsEditingBilling(true);
  };

  const handleSaveBilling = async () => {
    if (!selectedUser) return;

    try {
      setLoadingBillingEdit(true);
      console.log('🔄 Updating billing for user:', selectedUser.email);

      // Prepare billing data
      const billingData = {
        billing_name: billingSameAsAccount ? null : billingForm.name,
        billing_email: billingSameAsAccount ? null : billingForm.email,
        billing_phone: billingSameAsAccount ? null : billingForm.phone,
        billing_address: billingSameAsAccount ? null : JSON.stringify({
          line1: billingForm.address,
          city: billingForm.city,
          state: billingForm.state,
          postal_code: billingForm.zip,
          country: billingForm.country
        }),
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📊 Billing data to update:', billingData);

      // Update in database
      const { error: dbError } = await supabase
        .from('users')
        .update(billingData)
        .eq('id', selectedUser.id);

      if (dbError) {
        console.error('❌ Database update error:', dbError);
        throw dbError;
      }

      console.log('✅ Database updated successfully');

      // If user has Stripe customer, update in Stripe
      if (selectedUser.stripe_customer_id) {
        console.log('🔄 Updating Stripe customer:', selectedUser.stripe_customer_id);
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-billing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            userEmail: selectedUser.email,
            billingName: billingSameAsAccount ? null : billingForm.name,
            billingEmail: billingSameAsAccount ? null : billingForm.email,
            billingPhone: billingSameAsAccount ? null : billingForm.phone,
            billingAddress: billingSameAsAccount ? null : {
              line1: billingForm.address,
              city: billingForm.city,
              state: billingForm.state,
              postal_code: billingForm.zip,
              country: billingForm.country
            }
          })
        });

        console.log('📡 Stripe update response status:', response.status);

        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Stripe update successful:', responseData);
        } else {
          const errorText = await response.text();
          console.error('❌ Stripe update failed:', response.status, errorText);
          toast.warning('Database updated but Stripe sync failed');
        }
      } else {
        console.log('⚠️ No Stripe customer ID, skipping Stripe update');
      }

      // Log the billing change
      try {
        await supabase.rpc('log_billing_change', {
          p_user_id: selectedUser.id,
          p_admin_id: selectedUser.id, // For now, using same user as admin
          p_change_type: 'billing_update',
          p_old_values: {
            billing_name: selectedUser.billing_name,
            billing_email: selectedUser.billing_email,
            billing_phone: selectedUser.billing_phone
          },
          p_new_values: billingData,
          p_reason: 'Billing information updated via admin panel'
        });
        console.log('✅ Billing change logged');
      } catch (logError) {
        console.error('❌ Error logging billing change:', logError);
      }

      toast.success('Billing information updated successfully');
      setIsEditingBilling(false);
      fetchUsers(); // Refresh to show updated data
      fetchActivityHistory(selectedUser.id); // Refresh activity history
    } catch (error) {
      console.error('❌ Error updating billing:', error);
      toast.error('Failed to update billing information');
    } finally {
      setLoadingBillingEdit(false);
    }
  };

  const cancelBillingEdit = () => {
    setIsEditingBilling(false);
    setBillingForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    });
  };

  // Handle "same as account" checkbox
  const handleBillingSameAsAccount = (checked: boolean) => {
    setBillingSameAsAccount(checked);
    if (checked && selectedUser) {
      setBillingForm({
        name: `${selectedUser.first_name} ${selectedUser.last_name}`,
        email: selectedUser.email,
        phone: selectedUser.phone || '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'US'
      });
    }
  };

  // Fetch activity history for a user
  const fetchActivityHistory = async (userId: string) => {
    try {
      setLoadingActivity(true);
      console.log('🔄 Fetching activity history for user:', userId);
      
      // Get billing changes
      const { data: billingChanges, error: billingError } = await supabase
        .from('billing_changes')
        .select(`
          id,
          change_type,
          reason,
          created_at,
          old_values,
          new_values,
          admin:admin_id(email, first_name, last_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (billingError) {
        console.error('❌ Error fetching billing changes:', billingError);
      }

      // Get admin actions
      const { data: adminActions, error: adminError } = await supabase
        .from('admin_actions')
        .select(`
          id,
          action_type,
          details,
          created_at,
          admin:admin_id(email, first_name, last_name)
        `)
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });

      if (adminError) {
        console.error('❌ Error fetching admin actions:', adminError);
      }

      // Combine and format activity history
      const activities: ActivityHistory[] = [];
      
      if (billingChanges) {
        billingChanges.forEach((change: any) => {
          const admin = Array.isArray(change.admin) ? change.admin[0] : change.admin;
          activities.push({
            id: change.id,
            action_type: change.change_type,
            description: change.reason || `${change.change_type} updated`,
            created_at: change.created_at,
            admin_email: admin?.email,
            admin_name: `${admin?.first_name || ''} ${admin?.last_name || ''}`.trim(),
            old_values: change.old_values,
            new_values: change.new_values
          });
        });
      }

      if (adminActions) {
        adminActions.forEach((action: any) => {
          const admin = Array.isArray(action.admin) ? action.admin[0] : action.admin;
          activities.push({
            id: action.id,
            action_type: action.action_type,
            description: action.details?.description || action.action_type,
            created_at: action.created_at,
            admin_email: admin?.email,
            admin_name: `${admin?.first_name || ''} ${admin?.last_name || ''}`.trim(),
            old_values: action.details?.old_values,
            new_values: action.details?.new_values
          });
        });
      }

      // Sort by creation date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('📊 Activity history:', activities.length, 'activities');
      setActivityHistory(activities);
    } catch (error) {
      console.error('❌ Error fetching activity history:', error);
      toast.error('Failed to fetch activity history');
    } finally {
      setLoadingActivity(false);
    }
  };

  // Promo management functions
  const handleAddPromo = async () => {
    if (!selectedUser || !promoForm.type) return;
    
    setLoadingPromo(true);
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + promoForm.duration_days);
      
      const { error } = await supabase
        .from('users')
        .update({
          promo_active: true,
          promo_type: promoForm.type,
          promo_expiration_date: expirationDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(`Promo applied successfully to ${selectedUser.email}`);
      setShowAddPromo(false);
      setPromoForm({ type: '', duration_days: 90, notes: '' });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Error applying promo:', error);
      toast.error('Failed to apply promo');
    } finally {
      setLoadingPromo(false);
    }
  };

  const handleRemovePromo = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          promo_active: false,
          promo_type: null,
          promo_expiration_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Promo removed successfully');
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Error removing promo:', error);
      toast.error('Failed to remove promo');
    }
  };

  const getPromoDiscount = (promoType: string) => {
    const discounts = {
      'founding_member': '3 months for $25',
      'one_week_trial': '1 week free',
      'beta_tester': '50% off',
      'early_adopter': '25% off'
    };
    return discounts[promoType as keyof typeof discounts] || promoType;
  };

  const getDaysRemaining = (expirationDate: string) => {
    const days = Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all users and their subscriptions</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportUsers} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateUser(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="admins">Admins</SelectItem>
            <SelectItem value="founding_members">Founding Members</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-900">User</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Role</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Subscription</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Joined</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.first_name ? user.first_name.charAt(0) : user.email.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}` 
                              : user.first_name || user.last_name || 'N/A'
                            }
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-700">
                        {user.is_admin ? 'Admin' : 'User'}
                      </Badge>
                    </td>
                    <td className="py-5 px-6 text-sm text-gray-700">
                      {user.current_plan_id ? getPlanById(user.current_plan_id)?.name || 'N/A' : 'Free'}
                    </td>
                    <td className="py-5 px-6">
                      <Badge
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(user).color} border ${getStatusDisplay(user).color.replace('text', 'border')}`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusDisplay(user).icon}
                          <span>{getStatusDisplay(user).text}</span>
                        </div>
                      </Badge>
                    </td>
                    <td className="py-5 px-6 text-sm text-gray-700">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-5 px-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUserId(user.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input 
                  value={newUser.first_name} 
                  onChange={e => setNewUser({...newUser, first_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input 
                  value={newUser.last_name} 
                  onChange={e => setNewUser({...newUser, last_name: e.target.value})} 
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  value={newUser.email} 
                  onChange={e => setNewUser({...newUser, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  value={newUser.phone} 
                  onChange={e => setNewUser({...newUser, phone: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Company</label>
                <Input 
                  value={newUser.company} 
                  onChange={e => setNewUser({...newUser, company: e.target.value})} 
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input 
                  value={newUser.job_title} 
                  onChange={e => setNewUser({...newUser, job_title: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subscription Plan</label>
                <Select
                  value={newUser.subscription_plan}
                  onValueChange={(value) => setNewUser({...newUser, subscription_plan: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospector">Prospector</SelectItem>
                    <SelectItem value="rainmaker">Rainmaker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={newUser.status}
                  onValueChange={(value) => setNewUser({...newUser, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={newUser.is_admin}
                  onChange={(e) => setNewUser({...newUser, is_admin: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="is_admin" className="text-sm font-medium">Admin Access</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="founding_member"
                  checked={newUser.founding_member}
                  onChange={(e) => setNewUser({...newUser, founding_member: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="founding_member" className="text-sm font-medium">Founding Member</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createUser(newUser)}
              disabled={!newUser.email || !newUser.first_name || !newUser.last_name}
              className="bg-green-600 hover:bg-green-700"
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comprehensive User Profile Modal */}
      <Dialog open={showUserProfile} onOpenChange={(open) => { 
        setShowUserProfile(open); 
        if (!open) {
          setSelectedUserId(null);
          setSelectedUser(null);
          setUserTransactions([]);
          setActivityHistory([]); // Clear activity history when closing
        }
      }}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile - {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column - User Info & Account Details */}
              <div className="xl:col-span-1 space-y-6">
                {/* User Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Account Information
                      </div>
                      {!isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={startEditing}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">First Name</label>
                            <Input
                              value={editForm.first_name}
                              onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Last Name</label>
                            <Input
                              value={editForm.last_name}
                              onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input
                              value={editForm.email}
                              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Phone</label>
                            <Input
                              value={editForm.phone}
                              onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Company</label>
                            <Input
                              value={editForm.company}
                              onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Job Title</label>
                            <Input
                              value={editForm.job_title}
                              onChange={(e) => setEditForm({...editForm, job_title: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select
                              value={editForm.status}
                              onValueChange={(value) => setEditForm({...editForm, status: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="is_admin_edit"
                              checked={editForm.is_admin}
                              onChange={(e) => setEditForm({...editForm, is_admin: e.target.checked})}
                              className="rounded"
                            />
                            <label htmlFor="is_admin_edit" className="text-sm font-medium">Admin Access</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="founding_member_edit"
                              checked={editForm.founding_member}
                              onChange={(e) => setEditForm({...editForm, founding_member: e.target.checked})}
                              className="rounded"
                            />
                            <label htmlFor="founding_member_edit" className="text-sm font-medium">Founding Member</label>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={handleSaveUser}
                            disabled={loadingUserEdit}
                            className="flex-1"
                          >
                            {loadingUserEdit ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">First Name</label>
                            <p className="text-sm">{selectedUser.first_name || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Last Name</label>
                            <p className="text-sm">{selectedUser.last_name || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Email</label>
                            <p className="text-sm">{selectedUser.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Phone</label>
                            <p className="text-sm">{selectedUser.phone || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Company</label>
                            <p className="text-sm">{selectedUser.company || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Job Title</label>
                            <p className="text-sm">{selectedUser.job_title || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <Badge variant={selectedUser.status === 'active' ? 'default' : 'secondary'}>
                              {selectedUser.status}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Member Since</label>
                            <p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="is_admin_display"
                              checked={selectedUser.is_admin}
                              disabled
                              className="rounded"
                            />
                            <label htmlFor="is_admin_display" className="text-sm font-medium">Admin Access</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="founding_member_display"
                              checked={selectedUser.founding_member}
                              disabled
                              className="rounded"
                            />
                            <label htmlFor="founding_member_display" className="text-sm font-medium">Founding Member</label>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Billing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Billing Information
                      </div>
                      {!isEditingBilling && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={startBillingEdit}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditingBilling ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="billing_same_as_account"
                            checked={billingSameAsAccount}
                            onChange={(e) => handleBillingSameAsAccount(e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor="billing_same_as_account" className="text-sm font-medium">
                            Billing same as account information
                          </label>
                        </div>

                        {/* Billing Form */}
                        {!billingSameAsAccount && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Billing Name</label>
                                <Input
                                  value={billingForm.name}
                                  onChange={(e) => setBillingForm({...billingForm, name: e.target.value})}
                                  placeholder="Full name"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Billing Email</label>
                                <Input
                                  value={billingForm.email}
                                  onChange={(e) => setBillingForm({...billingForm, email: e.target.value})}
                                  placeholder="billing@company.com"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Billing Phone</label>
                              <Input
                                value={billingForm.phone}
                                onChange={(e) => setBillingForm({...billingForm, phone: e.target.value})}
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Billing Address</label>
                              <Input
                                value={billingForm.address}
                                onChange={(e) => setBillingForm({...billingForm, address: e.target.value})}
                                placeholder="123 Main St"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <Input
                                value={billingForm.city}
                                onChange={(e) => setBillingForm({...billingForm, city: e.target.value})}
                                placeholder="City"
                              />
                              <Input
                                value={billingForm.state}
                                onChange={(e) => setBillingForm({...billingForm, state: e.target.value})}
                                placeholder="State"
                              />
                              <Input
                                value={billingForm.zip}
                                onChange={(e) => setBillingForm({...billingForm, zip: e.target.value})}
                                placeholder="ZIP"
                              />
                            </div>
                          </div>
                        )}

                        {/* Save/Cancel Buttons */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={handleSaveBilling}
                            disabled={loadingBillingEdit}
                            className="flex-1"
                          >
                            {loadingBillingEdit ? 'Saving...' : 'Save Billing'}
                          </Button>
                          <Button
                            onClick={cancelBillingEdit}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Billing Name</label>
                            <p className="text-sm">
                              {selectedUser.billing_name || `${selectedUser.first_name} ${selectedUser.last_name}`}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Billing Email</label>
                            <p className="text-sm">
                              {selectedUser.billing_email || selectedUser.email}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Billing Phone</label>
                            <p className="text-sm">
                              {selectedUser.billing_phone || selectedUser.phone || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Sync Status</label>
                            <div className="flex items-center gap-2">
                              <Badge variant={selectedUser.last_sync_at ? 'default' : 'destructive'}>
                                {selectedUser.last_sync_at ? 'Synced' : 'Not Synced'}
                              </Badge>
                              {selectedUser.last_sync_at && (
                                <span className="text-xs text-gray-500">
                                  {new Date(selectedUser.last_sync_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Sync with Stripe Button */}
                        {selectedUser.stripe_customer_id && (
                          <div className="pt-4 border-t space-y-2">
                            <Button
                              onClick={handleSyncWithStripe}
                              disabled={loadingStripeSync}
                              variant="outline"
                              className="w-full"
                            >
                              {loadingStripeSync ? 'Syncing...' : 'Sync with Stripe'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => sendWelcomeEmail(selectedUser.email, selectedUser.first_name || 'there', selectedUser.founding_member)}
                      disabled={loadingEmail || selectedUser.status === 'active'}
                      className="w-full justify-start"
                      variant="outline"
                      title={selectedUser.status === 'active' ? 'User has already set up their account' : ''}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {loadingEmail ? 'Sending...' : 'Resend Welcome Email'}
                    </Button>
                    
                    <Button 
                      onClick={() => sendPasswordReset(selectedUser.email)}
                      disabled={loadingPasswordReset}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {loadingPasswordReset ? 'Sending...' : 'Reset Password'}
                    </Button>

                    {selectedUser.stripe_customer_id && (
                      <Button 
                        onClick={() => window.open(`https://dashboard.stripe.com/customers/${selectedUser.stripe_customer_id}`, '_blank')}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View in Stripe
                      </Button>
                    )}

                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.email);
                        toast.success('Email copied to clipboard');
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Email
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Column - Subscription & Billing Details */}
              <div className="xl:col-span-1 space-y-6">
                {/* Stripe Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Subscription Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Customer ID</label>
                        <p className="text-sm font-mono text-xs">
                          {selectedUser.stripe_customer_id || 'Not connected'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Subscription ID</label>
                        <p className="text-sm font-mono text-xs">
                          {selectedUser.stripe_subscription_id || 'Not connected'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Plan</label>
                        <div className="space-y-1">
                          {selectedUser.founding_member ? (
                            <div>
                              {selectedUser.founding_member_transitioned_at ? (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Prospector ($75/month)</span>
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    Transitioned from Founding Member on {new Date(selectedUser.founding_member_transitioned_at).toLocaleDateString()}
                                  </span>
                                </p>
                              ) : (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Founding Member ($25 for 3 months)</span>
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    Purchased {selectedUser.founding_member_purchased_at ? new Date(selectedUser.founding_member_purchased_at).toLocaleDateString() : 'N/A'}
                                  </span>
                                </p>
                              )}
                            </div>
                                                      ) : (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">{getPlanById(selectedUser.current_plan_id || selectedUser.subscription_plan)?.name || selectedUser.subscription_plan}</span>
                              </p>
                            )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Subscription Status</label>
                        <Badge variant={
                          selectedUser.subscription_status === 'active' ? 'default' :
                          selectedUser.subscription_status === 'past_due' ? 'destructive' : 'secondary'
                        }>
                          {selectedUser.subscription_status || 'Inactive'}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Period End</label>
                        <p className="text-sm">
                          {selectedUser.current_period_end ? 
                           new Date(selectedUser.current_period_end).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Promo Status</label>
                        <div className="flex items-center gap-2">
                          <Badge variant={selectedUser.promo_active ? 'default' : 'secondary'}>
                            {selectedUser.promo_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {selectedUser.promo_type && (
                            <span className="text-xs text-gray-500">
                              {selectedUser.promo_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Promo Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Promo Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Promo</label>
                        <div className="space-y-2">
                          {selectedUser.promo_active ? (
                            <div>
                              <p className="text-sm font-medium">
                                {getPromoDiscount(selectedUser.promo_type || '')}
                              </p>
                              {selectedUser.promo_expiration_date && (
                                <p className="text-xs text-gray-500">
                                  Expires: {new Date(selectedUser.promo_expiration_date).toLocaleDateString()}
                                  ({getDaysRemaining(selectedUser.promo_expiration_date)} days left)
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No active promo</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Promo Actions</label>
                        <div className="space-y-2">
                          <Button 
                            onClick={() => setShowAddPromo(true)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Promo
                          </Button>
                          
                          {selectedUser.promo_active && (
                            <Button 
                              onClick={() => handleRemovePromo(selectedUser.id)}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove Promo
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Service Tools */}
                {selectedUser.stripe_customer_id && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Customer Service
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={() => setShowBillingUpdate(true)}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Update Billing Info
                      </Button>

                      <Button 
                        onClick={() => setShowRefundModal(true)}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Process Refund
                      </Button>

                      <Button 
                        onClick={() => setShowSubscriptionChange(true)}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Change Subscription
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Payment History & Activity */}
              <div className="xl:col-span-1 space-y-6">
                {/* Payment History & Card Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Payment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Card Information */}
                    {userPaymentMethods.length > 0 && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Payment Method on File</h4>
                        {userPaymentMethods.map((pm) => (
                          <div key={pm.id} className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-600" />
                              <span className="font-medium capitalize">{pm.card_brand}</span>
                              <span className="text-gray-600">**** {pm.card_last4}</span>
                              <span className="text-gray-500 text-sm">
                                Expires {pm.card_exp_month}/{pm.card_exp_year}
                              </span>
                            </div>
                            {pm.is_default && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Payment History */}
                    {loadingTransactions ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : userTransactions.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {userTransactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  ${(transaction.amount / 100).toFixed(2)}
                                </span>
                                <Badge variant={
                                  transaction.status === 'succeeded' ? 'default' :
                                  transaction.status === 'pending' ? 'secondary' :
                                  transaction.status === 'failed' ? 'destructive' : 'outline'
                                }>
                                  {transaction.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {transaction.description || 'Payment'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {transaction.receipt_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(transaction.receipt_url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No payment history available</p>
                        <p className="text-sm">Payment history will appear here once transactions are processed</p>
                      </div>
                    )}
                    
                    {selectedUser.stripe_customer_id && (
                      <div className="pt-4 border-t space-y-2">
                        <Button
                          onClick={() => fetchUserTransactions(selectedUser.id)}
                          disabled={loadingTransactions}
                          variant="outline"
                          className="w-full"
                        >
                          {loadingTransactions ? 'Loading...' : 'Refresh Payment History'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Activity History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingActivity ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : activityHistory.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {activityHistory.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {activity.admin_name || 'System'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {activity.old_values && activity.new_values && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Changed from:</span>
                                <Badge variant="outline">{JSON.stringify(activity.old_values)}</Badge>
                                <span>to:</span>
                                <Badge variant="outline">{JSON.stringify(activity.new_values)}</Badge>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No activity history available</p>
                        <p className="text-sm">User activity will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Promo Modal */}
      <Dialog open={showAddPromo} onOpenChange={setShowAddPromo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Promo Code</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Promo Type</label>
              <Select 
                value={promoForm.type}
                onValueChange={(value) => setPromoForm({...promoForm, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select promo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="founding_member">Founding Member (3 months for $25)</SelectItem>
                  <SelectItem value="one_week_trial">1 Week Trial (Free)</SelectItem>
                  <SelectItem value="beta_tester">Beta Tester (50% off)</SelectItem>
                  <SelectItem value="early_adopter">Early Adopter (25% off)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Duration (days)</label>
              <Input 
                type="number"
                value={promoForm.duration_days}
                onChange={(e) => setPromoForm({...promoForm, duration_days: parseInt(e.target.value) || 90})}
                placeholder="90"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Notes</label>
              <Input 
                value={promoForm.notes}
                onChange={(e) => setPromoForm({...promoForm, notes: e.target.value})}
                placeholder="Reason for applying this promo..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleAddPromo}
              disabled={loadingPromo || !promoForm.type}
            >
              {loadingPromo ? 'Applying...' : 'Apply Promo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 