type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context
    };

    // In development, use console
    if (this.isDevelopment) {
      const prefix = context ? `[${context}]` : '';
      switch (level) {
        case 'debug':
          console.debug(`${prefix} ${message}`, data);
          break;
        case 'info':
          console.info(`${prefix} ${message}`, data);
          break;
        case 'warn':
          console.warn(`${prefix} ${message}`, data);
          break;
        case 'error':
          console.error(`${prefix} ${message}`, data);
          break;
      }
    }

    // In production, send to external service
    if (this.isProduction) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // TODO: Implement external logging service (Sentry, LogRocket, etc.)
    // For now, just store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('linky_logs') || '[]');
      logs.push(entry);
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      localStorage.setItem('linky_logs', JSON.stringify(logs));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: any, context?: string) {
    this.log('error', message, data, context);
  }

  // Utility method for API calls
  apiCall(endpoint: string, method: string, data?: any) {
    this.info(`API ${method} ${endpoint}`, data, 'API');
  }

  // Utility method for user actions
  userAction(action: string, userId?: string, data?: any) {
    this.info(`User action: ${action}`, { userId, ...data }, 'USER');
  }

  // Utility method for errors
  errorWithContext(error: Error, context: string, additionalData?: any) {
    this.error(error.message, {
      stack: error.stack,
      context,
      ...additionalData
    }, context);
  }
}

export const logger = new Logger();

// Export individual methods for convenience
export const { debug, info, warn, error, apiCall, userAction, errorWithContext } = logger; 