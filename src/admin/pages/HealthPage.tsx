import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Activity, 
  Database, 
  CreditCard, 
  Mail, 
  Server, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Cpu,
  HardDrive
} from 'lucide-react';
import { health, metrics } from '../../lib/monitoring';
import { log } from '../../lib/logger';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  timestamp: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    loadTime: number;
    renderTime: number;
  };
  errors: {
    count: number;
    lastError?: string;
  };
  users: {
    active: number;
    total: number;
  };
}

export default function HealthPage() {
  const [healthStatus, setHealthStatus] = useState<HealthCheck[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [uptime, setUptime] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(loadHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      // Get health status
      const healthData = health.getStatus();
      setHealthStatus(healthData);

      // Get metrics
      const metricsData = metrics.getMetrics();
      setSystemMetrics(metricsData);

      // Get uptime and error count
      setUptime(health.getUptime());
      setErrorCount(metrics.getErrorCount());

      setLastRefresh(new Date());
      log.info('Health data refreshed', { 
        healthChecks: healthData.length, 
        metricsCount: metricsData.length 
      });
    } catch (error) {
      log.error('Failed to load health data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerHealthCheck = async (checkName?: string) => {
    setIsLoading(true);
    try {
      await health.triggerCheck(checkName);
      await loadHealthData();
      log.info('Manual health check triggered', { checkName });
    } catch (error) {
      log.error('Failed to trigger health check', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const overallStatus = healthStatus.length > 0 
    ? healthStatus.some(h => h.status === 'unhealthy') ? 'unhealthy'
    : healthStatus.some(h => h.status === 'degraded') ? 'degraded'
    : 'healthy'
    : 'unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor system status, performance, and health checks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => triggerHealthCheck()}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(overallStatus)}
              <div>
                <p className="font-medium">System</p>
                {getStatusBadge(overallStatus)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Uptime</p>
                <p className="text-sm text-muted-foreground">{formatUptime(uptime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium">Errors</p>
                <p className="text-sm text-muted-foreground">{errorCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Health Checks</p>
                <p className="text-sm text-muted-foreground">{healthStatus.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthStatus.map((check) => (
              <Card key={check.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {check.name === 'database_connection' && <Database className="h-4 w-4" />}
                      {check.name === 'stripe_connection' && <CreditCard className="h-4 w-4" />}
                      {check.name === 'email_service' && <Mail className="h-4 w-4" />}
                      {check.name === 'api_endpoints' && <Server className="h-4 w-4" />}
                      {check.name}
                    </CardTitle>
                    {getStatusBadge(check.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{check.message}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Duration: {check.duration ? `${check.duration}ms` : 'N/A'}</span>
                    <span>{new Date(check.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {check.metadata && Object.keys(check.metadata).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        Details
                      </summary>
                      <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(check.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemMetrics.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span>{formatBytes(systemMetrics[systemMetrics.length - 1].memory.used)}</span>
                    </div>
                    <Progress 
                      value={systemMetrics[systemMetrics.length - 1].memory.percentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total</span>
                      <span>{formatBytes(systemMetrics[systemMetrics.length - 1].memory.total)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemMetrics.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Load Time</span>
                      <span>{systemMetrics[systemMetrics.length - 1].performance.loadTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Render Time</span>
                      <span>{systemMetrics[systemMetrics.length - 1].performance.renderTime}ms</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {systemMetrics.slice(-10).reverse().map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{new Date(metric.timestamp).toLocaleTimeString()}</span>
                    <div className="flex gap-4 text-sm">
                      <span>Memory: {metric.memory.percentage.toFixed(1)}%</span>
                      <span>Load: {metric.performance.loadTime}ms</span>
                      <span>Errors: {metric.errors.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Environment</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <Badge variant="outline">{import.meta.env.MODE}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span>{import.meta.env.VITE_APP_VERSION || '1.0.0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Build Time:</span>
                      <span>{import.meta.env.VITE_BUILD_TIME || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Browser</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>User Agent:</span>
                      <span className="text-xs truncate max-w-32">{navigator.userAgent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Language:</span>
                      <span>{navigator.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Online:</span>
                      <Badge variant={navigator.onLine ? "default" : "destructive"}>
                        {navigator.onLine ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 