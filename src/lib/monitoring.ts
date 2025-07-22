// Production monitoring system for Linky
import { log } from './logger';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
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

class Monitoring {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: SystemMetrics[] = [];
  private errorCount = 0;
  private lastError?: string;
  private startTime = Date.now();

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Set up periodic health checks
    setInterval(() => {
      this.runHealthChecks();
    }, 30000); // Every 30 seconds

    // Set up periodic metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute

    // Set up error tracking
    this.setupErrorTracking();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();
  }

  private setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.recordError(event.error?.message || 'Unknown error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  private setupPerformanceMonitoring() {
    // Monitor page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          
          log.performanceMetric('page_load_time', loadTime);
          log.performanceMetric('render_time', renderTime);
          
          this.updatePerformanceMetrics(loadTime, renderTime);
        }
      });
    }
  }

  private async runHealthChecks() {
    const checks = [
      this.checkDatabaseConnection(),
      this.checkStripeConnection(),
      this.checkEmailService(),
      this.checkApiEndpoints()
    ];

    const results = await Promise.allSettled(checks);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.updateHealthCheck(result.value);
      } else {
        this.updateHealthCheck({
          name: `check_${index}`,
          status: 'unhealthy',
          message: 'Health check failed',
          timestamp: new Date().toISOString(),
          metadata: { error: result.reason }
        });
      }
    });

    // Log overall system health
    this.logSystemHealth();
  }

  private async checkDatabaseConnection(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Test Supabase connection
      const { data, error } = await fetch('/api/health/database').then(r => r.json());
      
      const duration = Date.now() - startTime;
      
      if (error) {
        return {
          name: 'database_connection',
          status: 'unhealthy',
          message: 'Database connection failed',
          timestamp: new Date().toISOString(),
          duration,
          metadata: { error }
        };
      }

      return {
        name: 'database_connection',
        status: 'healthy',
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
        duration
      };
    } catch (error) {
      return {
        name: 'database_connection',
        status: 'unhealthy',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        metadata: { error: error.message }
      };
    }
  }

  private async checkStripeConnection(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Test Stripe webhook endpoint
      const response = await fetch('/api/health/stripe');
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          name: 'stripe_connection',
          status: 'degraded',
          message: 'Stripe connection issues',
          timestamp: new Date().toISOString(),
          duration,
          metadata: { status: response.status }
        };
      }

      return {
        name: 'stripe_connection',
        status: 'healthy',
        message: 'Stripe connection successful',
        timestamp: new Date().toISOString(),
        duration
      };
    } catch (error) {
      return {
        name: 'stripe_connection',
        status: 'unhealthy',
        message: 'Stripe connection failed',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        metadata: { error: error.message }
      };
    }
  }

  private async checkEmailService(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Test email service endpoint
      const response = await fetch('/api/health/email');
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          name: 'email_service',
          status: 'degraded',
          message: 'Email service issues',
          timestamp: new Date().toISOString(),
          duration,
          metadata: { status: response.status }
        };
      }

      return {
        name: 'email_service',
        status: 'healthy',
        message: 'Email service operational',
        timestamp: new Date().toISOString(),
        duration
      };
    } catch (error) {
      return {
        name: 'email_service',
        status: 'unhealthy',
        message: 'Email service failed',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        metadata: { error: error.message }
      };
    }
  }

  private async checkApiEndpoints(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Test main API endpoints
      const endpoints = ['/api/users', '/api/subscriptions', '/api/health'];
      const results = await Promise.allSettled(
        endpoints.map(endpoint => fetch(endpoint))
      );
      
      const duration = Date.now() - startTime;
      const failedEndpoints = results.filter(r => r.status === 'rejected').length;
      
      if (failedEndpoints === 0) {
        return {
          name: 'api_endpoints',
          status: 'healthy',
          message: 'All API endpoints operational',
          timestamp: new Date().toISOString(),
          duration
        };
      } else if (failedEndpoints < endpoints.length) {
        return {
          name: 'api_endpoints',
          status: 'degraded',
          message: `${failedEndpoints} API endpoints failed`,
          timestamp: new Date().toISOString(),
          duration,
          metadata: { failedEndpoints, totalEndpoints: endpoints.length }
        };
      } else {
        return {
          name: 'api_endpoints',
          status: 'unhealthy',
          message: 'All API endpoints failed',
          timestamp: new Date().toISOString(),
          duration,
          metadata: { failedEndpoints, totalEndpoints: endpoints.length }
        };
      }
    } catch (error) {
      return {
        name: 'api_endpoints',
        status: 'unhealthy',
        message: 'API health check failed',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        metadata: { error: error.message }
      };
    }
  }

  private updateHealthCheck(check: HealthCheck) {
    this.healthChecks.set(check.name, check);
    
    // Log health check results
    if (check.status === 'unhealthy') {
      log.error(`Health check failed: ${check.name}`, new Error(check.message), check.metadata);
    } else if (check.status === 'degraded') {
      log.warn(`Health check degraded: ${check.name}`, check.metadata);
    } else {
      log.debug(`Health check passed: ${check.name}`, check.metadata);
    }
  }

  private logSystemHealth() {
    const checks = Array.from(this.healthChecks.values());
    const healthy = checks.filter(c => c.status === 'healthy').length;
    const degraded = checks.filter(c => c.status === 'degraded').length;
    const unhealthy = checks.filter(c => c.status === 'unhealthy').length;
    
    const overallStatus = unhealthy > 0 ? 'unhealthy' : degraded > 0 ? 'degraded' : 'healthy';
    
    log.info('System health status', {
      overallStatus,
      healthy,
      degraded,
      unhealthy,
      totalChecks: checks.length
    });
  }

  private collectMetrics() {
    const memory = this.getMemoryUsage();
    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      memory,
      performance: this.getPerformanceMetrics(),
      errors: {
        count: this.errorCount,
        lastError: this.lastError
      },
      users: this.getUserMetrics()
    };

    this.metrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log metrics
    log.info('System metrics collected', metrics);
    
    // Send metrics to monitoring service
    this.sendMetricsToService(metrics);
  }

  private getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    
    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  private getPerformanceMetrics() {
    // Get performance metrics from the last collection
    const lastMetric = this.metrics[this.metrics.length - 1];
    return lastMetric?.performance || { loadTime: 0, renderTime: 0 };
  }

  private updatePerformanceMetrics(loadTime: number, renderTime: number) {
    const lastMetric = this.metrics[this.metrics.length - 1];
    if (lastMetric) {
      lastMetric.performance = { loadTime, renderTime };
    }
  }

  private getUserMetrics() {
    // This would typically come from your user tracking system
    return {
      active: 0, // TODO: Implement active user tracking
      total: 0   // TODO: Implement total user count
    };
  }

  private recordError(message: string, metadata?: Record<string, any>) {
    this.errorCount++;
    this.lastError = message;
    
    log.error(`Client-side error: ${message}`, new Error(message), metadata);
  }

  private async sendMetricsToService(metrics: SystemMetrics) {
    try {
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
      
      if (!response.ok) {
        throw new Error(`Metrics service responded with ${response.status}`);
      }
    } catch (error) {
      // Silently fail to avoid monitoring loops
      console.debug('Failed to send metrics to service:', error);
    }
  }

  // Public methods
  getHealthStatus(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  getMetrics(): SystemMetrics[] {
    return [...this.metrics];
  }

  getSystemUptime(): number {
    return Date.now() - this.startTime;
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  // Manual health check trigger
  async triggerHealthCheck(checkName?: string) {
    if (checkName) {
      // Run specific health check
      switch (checkName) {
        case 'database':
          this.updateHealthCheck(await this.checkDatabaseConnection());
          break;
        case 'stripe':
          this.updateHealthCheck(await this.checkStripeConnection());
          break;
        case 'email':
          this.updateHealthCheck(await this.checkEmailService());
          break;
        case 'api':
          this.updateHealthCheck(await this.checkApiEndpoints());
          break;
        default:
          log.warn(`Unknown health check: ${checkName}`);
      }
    } else {
      // Run all health checks
      await this.runHealthChecks();
    }
  }
}

// Create singleton instance
export const monitoring = new Monitoring();

// Export convenience functions
export const health = {
  getStatus: () => monitoring.getHealthStatus(),
  triggerCheck: (checkName?: string) => monitoring.triggerHealthCheck(checkName),
  getUptime: () => monitoring.getSystemUptime()
};

export const metrics = {
  getMetrics: () => monitoring.getMetrics(),
  getErrorCount: () => monitoring.getErrorCount()
}; 