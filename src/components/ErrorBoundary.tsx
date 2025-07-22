import React, { Component, ErrorInfo, ReactNode } from 'react';
import { log } from '../lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({ error, errorInfo, errorId });

    // Log error with comprehensive context
    log.error(
      'React Error Boundary caught error',
      error,
      {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ErrorBoundary',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      }
    );

    // Send error to external service in production
    if (import.meta.env.PROD) {
      this.sendErrorToService(error, errorInfo, errorId);
    }
  }

  private async sendErrorToService(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: import.meta.env.MODE
      };

      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });
    } catch (sendError) {
      // Silently fail to avoid error loops
      console.debug('Failed to send error to service:', sendError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                We've encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="rounded-md bg-gray-100 p-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">Error Details (Development):</p>
                  <p className="text-xs text-gray-600 mb-1">{this.state.error.message}</p>
                  {this.state.errorId && (
                    <p className="text-xs text-gray-500">Error ID: {this.state.errorId}</p>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="w-full"
                  variant="ghost"
                >
                  Reload Page
                </Button>
              </div>
              
              {this.state.errorId && (
                <p className="text-xs text-center text-gray-500">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for manual error reporting
export function useErrorReporter() {
  const reportError = (error: Error, context?: Record<string, any>) => {
    log.error('Manual error report', error, context);
  };

  return { reportError };
} 