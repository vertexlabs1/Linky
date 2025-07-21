import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Activity,
  Database,
  Zap,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Play
} from 'lucide-react';

interface SyncHealth {
  id: string;
  sync_type: string;
  status: string;
  users_processed: number;
  errors_encountered: number;
  error_details: any;
  started_at: string;
  completed_at: string;
  created_at: string;
}

interface BillingEvent {
  id: string;
  event_type: string;
  stripe_event_id: string;
  processed: boolean;
  retry_count: number;
  error_message?: string;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  stripe_event_id: string;
  event_type: string;
  delivery_status: string;
  retry_count: number;
  error_message?: string;
  created_at: string;
}

interface SystemStats {
  totalUsers: number;
  activeSubscriptions: number;
  pendingEvents: number;
  failedWebhooks: number;
  staleUsers: number;
}

export const HealthPage: React.FC = () => {
  const [syncHealth, setSyncHealth] = useState<SyncHealth[]>([]);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHealthData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);

      // Fetch sync health records
      const { data: syncData } = await supabase
        .from('sync_health')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent billing events
      const { data: eventsData } = await supabase
        .from('billing_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch webhook deliveries
      const { data: webhooksData } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setSyncHealth(syncData || []);
      setBillingEvents(eventsData || []);
      setWebhookDeliveries(webhooksData || []);

      // Calculate system stats
      const stats = await calculateSystemStats();
      setSystemStats(stats);

    } catch (error) {
      console.error('Error fetching health data:', error);
      toast.error('Failed to fetch system health data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateSystemStats = async (): Promise<SystemStats> => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');

      // Get pending events
      const { count: pendingEvents } = await supabase
        .from('billing_events')
        .select('*', { count: 'exact', head: true })
        .eq('processed', false);

      // Get failed webhooks
      const { count: failedWebhooks } = await supabase
        .from('webhook_deliveries')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_status', 'failed');

      // Get stale users (no sync in last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: staleUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .lt('last_sync_at', yesterday.toISOString());

      return {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        pendingEvents: pendingEvents || 0,
        failedWebhooks: failedWebhooks || 0,
        staleUsers: staleUsers || 0
      };
    } catch (error) {
      console.error('Error calculating system stats:', error);
      return {
        totalUsers: 0,
        activeSubscriptions: 0,
        pendingEvents: 0,
        failedWebhooks: 0,
        staleUsers: 0
      };
    }
  };

  const triggerManualSync = async () => {
    try {
      setRefreshing(true);
      
      // Call the daily billing sync function
      const { data, error } = await supabase.functions.invoke('daily-billing-sync');
      
      if (error) {
        console.error('Error triggering manual sync:', error);
        toast.error('Failed to trigger manual sync');
        return;
      }

      toast.success('Manual sync triggered successfully');
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchHealthData();
      }, 2000);

    } catch (error) {
      console.error('Error triggering manual sync:', error);
      toast.error('Failed to trigger manual sync');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading system health...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Health</h1>
          <p className="text-gray-500">Monitor system performance and sync status</p>
        </div>
        <Button
          onClick={triggerManualSync}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          {refreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {refreshing ? 'Syncing...' : 'Trigger Manual Sync'}
        </Button>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
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
                  <p className="text-2xl font-bold">{systemStats.activeSubscriptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500">Pending Events</p>
                  <p className="text-2xl font-bold">{systemStats.pendingEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Failed Webhooks</p>
                  <p className="text-2xl font-bold">{systemStats.failedWebhooks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Stale Users</p>
                  <p className="text-2xl font-bold">{systemStats.staleUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {systemStats && (systemStats.pendingEvents > 0 || systemStats.failedWebhooks > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {systemStats.pendingEvents > 0 && `${systemStats.pendingEvents} pending events need processing. `}
            {systemStats.failedWebhooks > 0 && `${systemStats.failedWebhooks} webhook deliveries failed. `}
            Consider triggering a manual sync to resolve these issues.
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Recent Sync Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncHealth.length > 0 ? (
            <div className="space-y-4">
              {syncHealth.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(sync.status)}
                    <div>
                      <p className="font-medium">{sync.sync_type}</p>
                      <p className="text-sm text-gray-500">
                        {sync.users_processed} users processed
                        {sync.errors_encountered > 0 && `, ${sync.errors_encountered} errors`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(sync.status)}>
                      {sync.status}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(sync.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No sync activity</h3>
              <p className="text-gray-500">Sync activity will appear here once the system starts processing data.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recent Billing Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingEvents.length > 0 ? (
            <div className="space-y-4">
              {billingEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(event.processed ? 'completed' : 'pending')}
                    <div>
                      <p className="font-medium">{event.event_type}</p>
                      <p className="text-sm text-gray-500">ID: {event.stripe_event_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(event.processed ? 'completed' : 'pending')}>
                      {event.processed ? 'Processed' : 'Pending'}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No billing events</h3>
              <p className="text-gray-500">Billing events will appear here once Stripe webhooks are processed.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Webhook Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhookDeliveries.length > 0 ? (
            <div className="space-y-4">
              {webhookDeliveries.slice(0, 10).map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(webhook.delivery_status)}
                    <div>
                      <p className="font-medium">{webhook.event_type}</p>
                      <p className="text-sm text-gray-500">ID: {webhook.stripe_event_id}</p>
                      {webhook.error_message && (
                        <p className="text-sm text-red-600">{webhook.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(webhook.delivery_status)}>
                      {webhook.delivery_status}
                    </Badge>
                    {webhook.retry_count > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Retries: {webhook.retry_count}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(webhook.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No webhook deliveries</h3>
              <p className="text-gray-500">Webhook delivery logs will appear here once Stripe webhooks are received.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 