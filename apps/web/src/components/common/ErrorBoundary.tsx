"use client";
import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import FlowCard from '@/components/river/FlowCard';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to error tracking service
    this.reportError(error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Send error report to monitoring service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private handleReportBug = () => {
    // Open bug report with pre-filled information
    const bugReportUrl = `mailto:support@rivor.app?subject=Bug Report ${this.state.errorId}&body=Error ID: ${this.state.errorId}%0AError: ${encodeURIComponent(this.state.error?.message || 'Unknown error')}%0APage: ${encodeURIComponent(window.location.href)}`;
    window.open(bugReportUrl);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          <FlowCard className="max-w-lg w-full">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </p>

              {/* Error details for development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-left">
                  <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Development Error Details:
                  </h3>
                  <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto">
                    {this.state.error.message}
                  </pre>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={this.handleRetry}
                    className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    onClick={this.handleReportBug}
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Report this issue
                  </Button>
                </div>

                {this.state.errorId && (
                  <p className="text-xs text-slate-500">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
            </div>
          </FlowCard>
        </div>
      );
    }

    return this.props.children;
  }
}
