// Production-ready logging system for Linky
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.isDevelopment = import.meta.env.DEV;
  }

  private getLogLevel(): LogLevel {
    const level = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    const userId = entry.userId ? ` | User: ${entry.userId}` : '';
    const sessionId = entry.sessionId ? ` | Session: ${entry.sessionId}` : '';
    const requestId = entry.requestId ? ` | Request: ${entry.requestId}` : '';
    
    return `[${timestamp}] ${levelName}: ${entry.message}${context}${userId}${sessionId}${requestId}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, metadata?: Record<string, any>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata
    };

    const formattedLog = this.formatLog(entry);

    // Console logging
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedLog);
        break;
    }

    // Send to external logging service in production
    if (!this.isDevelopment) {
      this.sendToLoggingService(entry);
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    try {
      // You can integrate with services like Sentry, LogRocket, or your own logging endpoint
      if (entry.level >= LogLevel.ERROR) {
        // Send errors to error tracking service
        await this.sendErrorToService(entry);
      }
      
      // Send all logs to your logging endpoint
      await this.sendLogToService(entry);
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to service:', error);
    }
  }

  private async sendErrorToService(entry: LogEntry) {
    // Integrate with Sentry or similar error tracking service
    if (entry.error) {
      // Example: Sentry.captureException(entry.error, { extra: entry.context });
      console.error('Error tracking service integration needed');
    }
  }

  private async sendLogToService(entry: LogEntry) {
    // Send to your logging endpoint
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      
      if (!response.ok) {
        throw new Error(`Logging service responded with ${response.status}`);
      }
    } catch (error) {
      // Silently fail to avoid logging loops
      console.debug('Failed to send log to service:', error);
    }
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  info(message: string, context?: Record<string, any>, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  warn(message: string, context?: Record<string, any>, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  error(message: string, error?: Error, context?: Record<string, any>, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      error,
      metadata
    };
    
    this.log(LogLevel.ERROR, message, context, metadata);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      message,
      context,
      error,
      metadata
    };
    
    this.log(LogLevel.FATAL, message, context, metadata);
  }

  // Specialized logging methods
  userAction(userId: string, action: string, details?: Record<string, any>) {
    this.info(`User Action: ${action}`, { userId, action, ...details });
  }

  paymentEvent(userId: string, event: string, amount?: number, details?: Record<string, any>) {
    this.info(`Payment Event: ${event}`, { userId, event, amount, ...details });
  }

  adminAction(adminId: string, action: string, targetUserId?: string, details?: Record<string, any>) {
    this.info(`Admin Action: ${action}`, { adminId, action, targetUserId, ...details });
  }

  stripeEvent(event: string, customerId?: string, details?: Record<string, any>) {
    this.info(`Stripe Event: ${event}`, { event, customerId, ...details });
  }

  databaseQuery(operation: string, table: string, duration?: number, details?: Record<string, any>) {
    this.debug(`Database Query: ${operation} on ${table}`, { operation, table, duration, ...details });
  }

  performanceMetric(metric: string, value: number, context?: Record<string, any>) {
    this.info(`Performance: ${metric} = ${value}`, { metric, value, ...context });
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context),
  fatal: (message: string, error?: Error, context?: Record<string, any>) => logger.fatal(message, error, context),
  userAction: (userId: string, action: string, details?: Record<string, any>) => logger.userAction(userId, action, details),
  paymentEvent: (userId: string, event: string, amount?: number, details?: Record<string, any>) => logger.paymentEvent(userId, event, amount, details),
  adminAction: (adminId: string, action: string, targetUserId?: string, details?: Record<string, any>) => logger.adminAction(adminId, action, targetUserId, details),
  stripeEvent: (event: string, customerId?: string, details?: Record<string, any>) => logger.stripeEvent(event, customerId, details),
  databaseQuery: (operation: string, table: string, duration?: number, details?: Record<string, any>) => logger.databaseQuery(operation, table, duration, details),
  performanceMetric: (metric: string, value: number, context?: Record<string, any>) => logger.performanceMetric(metric, value, context)
}; 