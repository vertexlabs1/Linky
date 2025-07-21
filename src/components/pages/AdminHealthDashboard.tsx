import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

export const AdminHealthDashboard: React.FC = () => {
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

      // Calculate system stats
      const stats = await calculateSystemStats();

      setSyncHealth(syncData || []);
      setBillingEvents(eventsData || []);
      setWebhookDeliveries(webhooksData || []);
      setSystemStats(stats);

    } catch (error) {
      console.error('Error fetching health data:', error);
      toast.error('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSystemStats = async (): Promise<SystemStats> => {
    // Get total users with subscriptions
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('stripe_subscription_id', 'is', null);

    // Get active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    // Get pending billing events (last 24h)
    const { count: pendingEvents } = await supabase
      .from('billing_events')
      .select('*', { count: 'exact', head: true })
      .eq('processed', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Get failed webhooks (last 24h)
    const { count: failedWebhooks } = await supabase
      .from('webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Get stale users (>48h since last sync)
    const { count: staleUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('stripe_subscription_id', 'is', null)
      .lt('last_sync_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    return {
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      pendingEvents: pendingEvents || 0,
      failedWebhooks: failedWebhooks || 0,
      staleUsers: staleUsers || 0
    };
  };

  const triggerManualSync = async () => {
    try {
      setRefreshing(true);
      
      // Call the daily sync function manually
      const { data, error } = await supabase.functions.invoke('daily-billing-sync', {
        body: { manual: true }
      });

      if (error) throw error;

      toast.success('Manual sync triggered successfully');
      
      // Refresh health data after a short delay
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
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failure':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failure':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Health Dashboard</h1>
          <p className="text-gray-500">Monitor billing synchronization and system health</p>
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
          Manual Sync
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{systemStats?.totalUsers || 0}</p>
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
                <p className="text-2xl font-bold">{systemStats?.activeSubscriptions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Pending Events</p>
                <p className="text-2xl font-bold">{systemStats?.pendingEvents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Failed Webhooks</p>
                <p className="text-2xl font-bold">{systemStats?.failedWebhooks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Stale Data</p>
                <p className="text-2xl font-bold">{systemStats?.staleUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(systemStats?.pendingEvents || 0) > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There are {systemStats?.pendingEvents} unprocessed billing events. Consider running a manual sync.
          </AlertDescription>
        </Alert>
      )}

      {(systemStats?.failedWebhooks || 0) > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {systemStats?.failedWebhooks} webhook deliveries failed in the last 24 hours. Check the webhook delivery log.
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Health History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Sync Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncHealth.length > 0 ? (
            <div className="space-y-3">
              {syncHealth.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(sync.status)}
                    <div>
                      <p className="font-medium capitalize">{sync.sync_type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        {sync.users_processed} users processed
                        {sync.errors_encountered > 0 && (
                          <span className="text-red-500 ml-2">
                            • {sync.errors_encountered} errors
                          </span>
                        )}
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
            <p className="text-gray-500 text-center py-4">No sync activity yet</p>
          )}
        </CardContent>
      </Card>

      {/* Unprocessed Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Unprocessed Billing Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingEvents.filter(e => !e.processed).length > 0 ? (
            <div className="space-y-3">
              {billingEvents
                .filter(e => !e.processed)
                .slice(0, 10)
                .map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{event.event_type}</p>
                    <p className="text-sm text-gray-500">
                      Event ID: {event.stripe_event_id}
                    </p>
                    {event.error_message && (
                      <p className="text-sm text-red-500 mt-1">
                        Error: {event.error_message}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Retry {event.retry_count}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">All billing events processed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Failed Webhook Deliveries (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhookDeliveries.filter(w => w.delivery_status === 'failed').length > 0 ? (
            <div className="space-y-3">
              {webhookDeliveries
                .filter(w => w.delivery_status === 'failed')
                .slice(0, 10)
                .map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{webhook.event_type}</p>
                    <p className="text-sm text-gray-500">
                      Event ID: {webhook.stripe_event_id}
                    </p>
                    {webhook.error_message && (
                      <p className="text-sm text-red-500 mt-1">
                        Error: {webhook.error_message}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-800">
                      Failed
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(webhook.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">No failed webhook deliveries</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 