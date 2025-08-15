"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, MessageSquare } from "lucide-react";
import { logError, generateRequestId } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: generateRequestId()
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || generateRequestId();
    
    // Log the error with correlation ID
    logError(error, {
      requestId: errorId,
      action: 'component_error',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private handleReport = () => {
    const subject = encodeURIComponent(`Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Additional details:
Please describe what you were doing when this error occurred.
`);
    window.open(`mailto:support@rivor.app?subject=${subject}&body=${body}`);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We encountered an unexpected error. This has been logged and our team will investigate.
                </p>
                
                {this.state.errorId && (
                  <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      Error ID: {this.state.errorId}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try Again
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={this.handleReport}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Report Issue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
