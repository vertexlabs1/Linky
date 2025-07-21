import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  User, 
  Crown, 
  CreditCard, 
  Receipt, 
  Mail, 
  Phone, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  Ban,
  DollarSign,
  RefreshCw,
  Download,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { 
  getPlanById, 
  getAvailableUpgrades, 
  getAvailableDowngrades, 
  getStatusColor, 
  getStatusIcon,
  formatPrice,
  SUBSCRIPTION_STATUSES 
} from '@/lib/stripe/stripe-service';

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
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  trial_end?: string;
  founding_member?: boolean;
  is_admin?: boolean;
  status: string;
  last_sync_at?: string;
  created_at: string;
}

interface AdminAction {
  id: string;
  action_type: string;
  old_value: any;
  new_value: any;
  reason: string;
  admin: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
  receipt_url?: string;
}

interface AdminUserProfileProps {
  userId: string;
  onClose: () => void;
}

export const AdminUserProfile: React.FC<AdminUserProfileProps> = ({ userId, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stripeData, setStripeData] = useState<any>(null);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Action modals
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState<{ action: string; data?: any } | null>(null);

  // Form states
  const [selectedPlan, setSelectedPlan] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    fetchCompleteUserData();
  }, [userId]);

  const fetchCompleteUserData = async () => {
    try {
      setLoading(true);

      // Get user from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Get admin action history
      const { data: actions, error: actionsError } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin:admin_id(first_name, last_name)
        `)
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!actionsError && actions) {
        setAdminActions(actions);
      }

      // If user has Stripe data, fetch it
      if (userData.stripe_subscription_id && userData.stripe_customer_id) {
        await fetchStripeData(userData.stripe_subscription_id, userData.stripe_customer_id);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStripeData = async (subscriptionId: string, customerId: string) => {
    try {
      // This would typically call a Supabase Edge Function to fetch Stripe data
      // For now, we'll simulate the data structure
      const mockStripeData = {
        subscription: {
          id: subscriptionId,
          status: user?.subscription_status || 'active',
          current_period_start: user?.current_period_start,
          current_period_end: user?.current_period_end,
          cancel_at_period_end: user?.cancel_at_period_end || false,
          items: {
            data: [{
              price: {
                id: 'price_123',
                unit_amount: getPlanById(user?.subscription_plan || 'prospector').price * 100,
                currency: 'usd'
              }
            }]
          }
        },
        customer: {
          id: customerId,
          email: user?.email,
          name: `${user?.first_name} ${user?.last_name}`
        },
        invoices: [] // Mock invoices array
      };

      setStripeData(mockStripeData);
    } catch (error) {
      console.error('Error fetching Stripe data:', error);
    }
  };

  const handleAdminAction = async (action: string, data?: any) => {
    if (!user) return;

    setActionLoading(true);
    try {
      // Call appropriate Supabase Edge Function based on action
      const { data: result, error } = await supabase.functions.invoke(`admin-${action}`, {
        body: {
          userId: user.id,
          reason: actionReason,
          ...data
        }
      });

      if (error) throw error;

      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} completed successfully`);
      
      // Refresh user data
      await fetchCompleteUserData();
      
      // Reset forms
      setActionReason('');
      setShowPlanChangeModal(false);
      setShowRefundModal(false);
      setShowReasonModal(null);

    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(`Failed to ${action}: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const userStats = useMemo(() => {
    if (!user || !stripeData) return null;

    const plan = getPlanById(user.subscription_plan);
    const subscription = stripeData.subscription;
    
    return {
      plan: plan,
      status: subscription.status,
      statusColor: getStatusColor(subscription.status),
      statusIcon: getStatusIcon(subscription.status),
      nextBilling: user.current_period_end ? new Date(user.current_period_end) : null,
      isFoundingMember: user.founding_member,
      isAdmin: user.is_admin,
      daysSinceJoined: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      lastSyncAgo: user.last_sync_at ? Math.floor((Date.now() - new Date(user.last_sync_at).getTime()) / (1000 * 60)) : null
    };
  }, [user, stripeData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-semibold">User Not Found</h3>
        <p className="text-gray-500">The requested user could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* User Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                {userStats?.isFoundingMember && (
                  <Crown className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.first_name} {user.last_name}</h1>
                <p className="text-gray-500 text-sm">{user.email}</p>
              </div>
            </CardTitle>
            <div className="flex gap-2">
              {userStats?.isAdmin && (
                <Badge className="bg-red-100 text-red-800">
                  <Crown className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
              {userStats?.isFoundingMember && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  👑 Founding Member
                </Badge>
              )}
              <Badge 
                className={`bg-${userStats?.statusColor}-100 text-${userStats?.statusColor}-800`}
              >
                {userStats?.statusIcon} {userStats?.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {user.phone || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Company</p>
              <p className="font-medium">{user.company || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Job Title</p>
              <p className="font-medium">{user.job_title || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {userStats?.daysSinceJoined} days ago
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              onClick={() => setShowPlanChangeModal(true)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <TrendingUp className="w-4 h-4" />
              Change Plan
            </Button>
            
            <Button 
              onClick={() => setShowRefundModal(true)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <DollarSign className="w-4 h-4" />
              Process Refund
            </Button>
            
            <Button 
              onClick={() => setShowReasonModal({ action: 'pause' })}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Pause className="w-4 h-4" />
              Pause Subscription
            </Button>
            
            <Button 
              onClick={() => setShowReasonModal({ action: 'resend-welcome' })}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Mail className="w-4 h-4" />
              Resend Welcome
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing Details */}
      {userStats && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Current Plan</p>
                <p className="font-medium text-lg">
                  {userStats.plan.emoji} {userStats.plan.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatPrice(userStats.plan.price)}/month
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium flex items-center gap-1">
                  {userStats.statusIcon} {userStats.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Billing</p>
                <p className="font-medium">
                  {userStats.nextBilling 
                    ? userStats.nextBilling.toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Sync</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {userStats.lastSyncAgo 
                    ? `${userStats.lastSyncAgo}m ago`
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Action History */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Action History</CardTitle>
        </CardHeader>
        <CardContent>
          {adminActions.length > 0 ? (
            <div className="space-y-3">
              {adminActions.map((action) => (
                <div key={action.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{action.action_type.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-gray-500">
                        By {action.admin?.first_name} {action.admin?.last_name}
                      </p>
                      {action.reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          Reason: {action.reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(action.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No admin actions yet</p>
          )}
        </CardContent>
      </Card>

      {/* Plan Change Modal */}
      <Dialog open={showPlanChangeModal} onOpenChange={setShowPlanChangeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Plan</label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new plan" />
                </SelectTrigger>
                <SelectContent>
                  {['prospector', 'networker', 'rainmaker'].map(planId => {
                    const plan = getPlanById(planId);
                    return (
                      <SelectItem key={planId} value={planId}>
                        {plan.emoji} {plan.name} - {formatPrice(plan.price)}/month
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for plan change..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanChangeModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleAdminAction('change-plan', { newPlan: selectedPlan })}
              disabled={!selectedPlan || !actionReason || actionLoading}
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Change Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Refund Amount ($)</label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for refund..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleAdminAction('refund', { amount: parseFloat(refundAmount) })}
              disabled={!refundAmount || !actionReason || actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason Modal (for other actions) */}
      <Dialog open={!!showReasonModal} onOpenChange={() => setShowReasonModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showReasonModal?.action === 'pause' && 'Pause Subscription'}
              {showReasonModal?.action === 'resend-welcome' && 'Resend Welcome Email'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={`Enter reason for ${showReasonModal?.action}...`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReasonModal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => showReasonModal && handleAdminAction(showReasonModal.action)}
              disabled={!actionReason || actionLoading}
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 