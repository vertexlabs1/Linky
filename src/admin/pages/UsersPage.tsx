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
  Calendar
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
  current_period_end?: string;
  founding_member?: boolean;
  is_admin?: boolean;
  status: string;
  last_sync_at?: string;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
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

  // Open modal when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      setEditUser(user || null);
      setShowEditModal(!!user);
    } else {
      setShowEditModal(false);
      setEditUser(null);
    }
  }, [selectedUserId, users]);

  const handleEditChange = (field: keyof User, value: any) => {
    if (!editUser) return;
    setEditUser({ ...editUser, [field]: value });
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
          is_admin: editUser.is_admin,
        })
        .eq('id', editUser.id);
      if (error) {
        toast.error('Failed to update user: ' + error.message);
        return;
      }
      toast.success('User updated successfully!');
      setShowEditModal(false);
      setSelectedUserId(null);
      await fetchUsers();
    } catch (err) {
      toast.error('Unexpected error updating user');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users...');

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          auth_user_id,
          email,
          first_name,
          last_name,
          phone,
          company,
          job_title,
          stripe_customer_id,
          stripe_subscription_id,
          subscription_plan,
          subscription_status,
          current_period_end,
          founding_member,
          status,
          is_admin,
          last_sync_at,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        // If is_admin column doesn't exist, try without it
        if (usersError.message.includes('is_admin')) {
          console.log('Retrying without is_admin column...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('users')
            .select(`
              id,
              auth_user_id,
              email,
              first_name,
              last_name,
              phone,
              company,
              job_title,
              stripe_customer_id,
              stripe_subscription_id,
              subscription_plan,
              subscription_status,
              current_period_end,
              founding_member,
              status,
              last_sync_at,
              created_at
            `)
            .order('created_at', { ascending: false });

          if (fallbackError) {
            console.error('Error with fallback query:', fallbackError);
            return;
          }

          // Add is_admin field with default value
          const usersWithAdmin = fallbackData?.map(user => ({
            ...user,
            is_admin: user.email === 'tyler@vxlabs.co' // Default Tyler as admin
          })) || [];

          setUsers(usersWithAdmin);
          return;
        }
        return;
      }

      setUsers(usersData || []);
      console.log(`✅ Fetched ${usersData?.length || 0} users`);
    } catch (error) {
      console.error('Unexpected error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
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
          phone: userData.phone,
          company: userData.company,
          job_title: userData.job_title,
          subscription_plan: userData.subscription_plan,
          subscription_status: 'inactive',
          status: userData.status,
          is_admin: userData.is_admin,
          founding_member: userData.founding_member,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        toast.error('Failed to create user: ' + error.message);
        return;
      }

      // Refresh the users list
      await fetchUsers();

      // Reset form
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

      setShowCreateUser(false);
      toast.success('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'admins':
        filtered = filtered.filter(user => user.is_admin === true);
        break;
      case 'founding_members':
        filtered = filtered.filter(user => user.founding_member === true);
        break;
      case 'active':
        filtered = filtered.filter(user => user.status === 'active');
        break;
      case 'inactive':
        filtered = filtered.filter(user => user.status !== 'active');
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    return filtered;
  }, [users, debouncedSearchTerm, filterType]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter(user => user.is_admin === true).length;
    const foundingMembers = users.filter(user => user.founding_member === true).length;
    const activeSubscriptions = users.filter(user => user.status === 'active').length;

    return { totalUsers, admins, foundingMembers, activeSubscriptions };
  }, [users]);

  const getSubscriptionBadgeColor = (plan: string) => {
    const colors: Record<string, string> = {
      'prospector': 'bg-blue-100 text-blue-800',
      'networker': 'bg-purple-100 text-purple-800',
      'rainmaker': 'bg-gold-100 text-gold-800',
      'founding_member': 'bg-yellow-100 text-yellow-800'
    };
    return colors[plan?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Add a function to get the proper status display
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
      case 'paid_not_onboarded':
        return { text: 'Paid, Account Not Created', color: 'text-orange-600', icon: <AlertTriangle className="w-3 h-3" /> };
      case 'pending':
        return { text: 'Pending', color: 'text-yellow-600', icon: <AlertTriangle className="w-3 h-3" /> };
      default:
        return { text: 'Unknown', color: 'text-gray-600', icon: <AlertTriangle className="w-3 h-3" /> };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">Manage user accounts and subscriptions</p>
        </div>
        <Button
          onClick={() => setShowCreateUser(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Admins</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Founding Members</p>
                <p className="text-2xl font-bold">{stats.foundingMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="admins">Admins</SelectItem>
            <SelectItem value="founding_members">Founding Members</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchUsers}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
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
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          {user.is_admin === true ? (
                            <Badge className="bg-red-100 text-red-800 border border-red-200">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50">
                              <User className="w-3 h-3 mr-1" />
                              User
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-2">
                          <Badge className={getSubscriptionBadgeColor(user.subscription_plan)}>
                            {user.subscription_plan?.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          {user.founding_member === true && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800">
                              Founding Member
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const statusDisplay = getStatusDisplay(user);
                            return (
                              <>
                                {statusDisplay.icon}
                                <span className={`text-sm font-medium ${statusDisplay.color}`}>
                                  {statusDisplay.text}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUserId(user.id)}
                          className="flex items-center gap-2 hover:bg-gray-50"
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
          ) : (
            <div className="text-center py-8">
              <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No users found</h3>
              <p className="text-gray-500">
                {debouncedSearchTerm || filterType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first user.'}
              </p>
            </div>
          )}
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
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                  placeholder="Doe"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Company</label>
                <Input
                  value={newUser.company}
                  onChange={(e) => setNewUser({...newUser, company: e.target.value})}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  value={newUser.job_title}
                  onChange={(e) => setNewUser({...newUser, job_title: e.target.value})}
                  placeholder="Job Title"
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
                    <SelectItem value="networker">Networker</SelectItem>
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

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => { setShowEditModal(open); if (!open) setSelectedUserId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          {editUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input value={editUser.first_name} onChange={e => handleEditChange('first_name', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input value={editUser.last_name} onChange={e => handleEditChange('last_name', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={editUser.email} onChange={e => handleEditChange('email', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={editUser.status} onValueChange={v => handleEditChange('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="paid_not_onboarded">Paid, Account Not Created</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={editUser.is_admin ? 'admin' : 'user'} onValueChange={v => handleEditChange('is_admin', v === 'admin')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div>Loading...</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedUserId(null); }}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editUser}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 