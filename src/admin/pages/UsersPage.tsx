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
  Edit
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
  is_admin?: boolean;
  status: string;
  last_sync_at?: string;
  created_at: string;
  billing_name?: string;
  billing_email?: string;
  billing_phone?: string;
  promo_active?: boolean;
  promo_type?: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string;
  stripe_payment_intent_id?: string;
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
  const [loadingActions, setLoadingActions] = useState(false);
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

  // Customer service modal states
  const [showBillingUpdate, setShowBillingUpdate] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSubscriptionChange, setShowSubscriptionChange] = useState(false);

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
      setLoadingActions(true);
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
      setLoadingActions(false);
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
      // Fetch transactions from your transactions table
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Don't show error toast for transactions as they might not exist yet
    } finally {
      setLoadingTransactions(false);
    }
  };

  const sendWelcomeEmail = async (email: string, firstName: string) => {
    try {
      setLoadingActions(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`, {
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
      
      toast.success(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      toast.error(`Failed to send welcome email: ${error.message}`);
    } finally {
      setLoadingActions(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      setLoadingActions(true);
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
      setLoadingActions(false);
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
      setLoadingActions(true);
      const { error } = await supabase
        .from('users')
        .update({
          last_sync_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('User synced with Stripe successfully');
      fetchUsers(); // Refresh the users list to show the updated last_sync_at
    } catch (error) {
      console.error('Error syncing user with Stripe:', error);
      toast.error('Failed to sync user with Stripe');
    } finally {
      setLoadingActions(false);
    }
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
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - User Info & Actions */}
              <div className="space-y-6">
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
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveUser}
                            disabled={loadingActions}
                            className="flex-1"
                          >
                            {loadingActions ? 'Saving...' : 'Save Changes'}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Name</label>
                          <p className="text-sm">{selectedUser.first_name} {selectedUser.last_name}</p>
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
                          <label className="text-sm font-medium text-gray-600">Admin Access</label>
                          <Badge variant={selectedUser.is_admin ? 'default' : 'secondary'}>
                            {selectedUser.is_admin ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Founding Member</label>
                          <Badge variant={selectedUser.founding_member ? 'default' : 'secondary'}>
                            {selectedUser.founding_member ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Billing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleSyncWithStripe}
                          disabled={loadingActions}
                          variant="outline"
                          className="w-full"
                        >
                          {loadingActions ? 'Syncing...' : 'Sync with Stripe'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stripe Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Stripe Information
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
                        <p className="text-sm">
                          {selectedUser.founding_member ? 'Founding Member ($25/3mo)' : 
                           selectedUser.current_plan_id ? getPlanById(selectedUser.current_plan_id)?.name || 'N/A' : 'Free'}
                        </p>
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

                {/* Action Buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => sendWelcomeEmail(selectedUser.email, selectedUser.first_name || 'there')}
                      disabled={loadingActions}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {loadingActions ? 'Sending...' : 'Resend Welcome Email'}
                    </Button>
                    
                    <Button 
                      onClick={() => sendPasswordReset(selectedUser.email)}
                      disabled={loadingActions}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {loadingActions ? 'Sending...' : 'Reset Password'}
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

                    {/* Customer Service Tools */}
                    {selectedUser.stripe_customer_id && (
                      <>
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
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Payment History & Stripe Info */}
              <div className="space-y-6">
                {/* Payment History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Payment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingTransactions ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Loading transactions...
                      </div>
                    ) : userTransactions.length > 0 ? (
                      <div className="space-y-3">
                        {userTransactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{transaction.description || 'Payment'}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(transaction.amount)}</p>
                              <Badge 
                                variant={transaction.status === 'succeeded' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No payment history available</p>
                        <p className="text-sm">Transactions will appear here once payments are processed</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 