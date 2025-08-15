import { logger } from './logger';

// Auth analytics events for tracking user journey and performance
export interface AuthAnalyticsEvent {
  event: string;
  userId?: string;
  provider?: string;
  correlationId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class AuthAnalytics {
  private sessionData: Map<string, { startTime: number; events: string[] }> = new Map();

  // Generate a correlation ID for tracking auth sessions
  private generateCorrelationId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start tracking an auth session
  startAuthSession(): string {
    const correlationId = this.generateCorrelationId();
    this.sessionData.set(correlationId, {
      startTime: Date.now(),
      events: []
    });
    
    this.track('auth_session_started', undefined, undefined, correlationId);
    return correlationId;
  }

  // Track auth events with performance timing
  track(
    event: string, 
    userId?: string, 
    provider?: string, 
    correlationId?: string,
    metadata: Record<string, any> = {}
  ): void {
    const timestamp = Date.now();
    const session = correlationId ? this.sessionData.get(correlationId) : undefined;
    
    // Calculate duration from session start if available
    let duration: number | undefined;
    if (session) {
      duration = timestamp - session.startTime;
      session.events.push(event);
    }

    // Track with enhanced analytics
    const analyticsEvent: AuthAnalyticsEvent = {
      event,
      userId,
      provider,
      correlationId,
      duration,
      metadata: {
        ...metadata,
        timestamp: new Date(timestamp).toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        screenWidth: typeof window !== 'undefined' ? window.screen.width : undefined,
        screenHeight: typeof window !== 'undefined' ? window.screen.height : undefined,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : undefined
      }
    };

    // Log for observability
    logger.info(`Auth Analytics: ${event}`, analyticsEvent);

    // Send to analytics service (PostHog, etc.)
    this.sendToAnalytics(analyticsEvent);
  }

  // Track page views
  trackPageView(page: 'signin' | 'error', correlationId?: string, metadata: Record<string, any> = {}): void {
    this.track(`auth_page_${page}_viewed`, undefined, undefined, correlationId, {
      page,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      ...metadata
    });
  }

  // Track user interactions
  trackInteraction(
    action: 'provider_clicked' | 'retry_clicked' | 'help_clicked' | 'status_clicked',
    provider?: string,
    correlationId?: string,
    metadata: Record<string, any> = {}
  ): void {
    this.track(`auth_${action}`, undefined, provider, correlationId, {
      action,
      provider,
      ...metadata
    });
  }

  // Track auth flow completion
  trackAuthComplete(
    success: boolean,
    provider: string,
    userId?: string,
    correlationId?: string,
    errorType?: string
  ): void {
    const session = correlationId ? this.sessionData.get(correlationId) : undefined;
    const totalDuration = session ? Date.now() - session.startTime : undefined;

    this.track(
      success ? 'auth_flow_completed' : 'auth_flow_failed',
      userId,
      provider,
      correlationId,
      {
        success,
        provider,
        errorType,
        totalDuration,
        eventCount: session?.events.length || 0,
        journey: session?.events || []
      }
    );

    // Clean up session data
    if (correlationId) {
      this.sessionData.delete(correlationId);
    }
  }

  // Track performance metrics
  trackPerformance(
    metric: 'page_load' | 'provider_response' | 'callback_processing',
    duration: number,
    correlationId?: string,
    metadata: Record<string, any> = {}
  ): void {
    this.track(`auth_performance_${metric}`, undefined, undefined, correlationId, {
      metric,
      duration,
      performance: {
        ...metadata,
        // Add browser performance if available
        ...(typeof window !== 'undefined' && window.performance ? {
          navigation: window.performance.getEntriesByType('navigation')[0],
          memory: (window.performance as any).memory
        } : {})
      }
    });
  }

  // Track errors with detailed context
  trackError(
    error: string,
    errorType: 'network' | 'oauth' | 'validation' | 'timeout' | 'unknown',
    provider?: string,
    correlationId?: string,
    metadata: Record<string, any> = {}
  ): void {
    this.track('auth_error_occurred', undefined, provider, correlationId, {
      error,
      errorType,
      provider,
      stack: metadata.stack,
      ...metadata
    });
  }

  // Send events to analytics service
  private sendToAnalytics(event: AuthAnalyticsEvent): void {
    try {
      // In a real implementation, this would send to PostHog, Mixpanel, etc.
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(event.event, {
          ...event.metadata,
          $user_id: event.userId,
          $duration: event.duration,
          provider: event.provider,
          correlation_id: event.correlationId
        });
      }
      
      // Also send to server-side analytics if needed
      if (typeof window !== 'undefined') {
        fetch('/api/analytics/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        }).catch(error => {
          console.warn('Failed to send auth analytics:', error);
        });
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Get session summary for debugging
  getSessionSummary(correlationId: string): { events: string[]; duration: number } | null {
    const session = this.sessionData.get(correlationId);
    if (!session) return null;

    return {
      events: [...session.events],
      duration: Date.now() - session.startTime
    };
  }
}

export const authAnalytics = new AuthAnalytics();

// Convenience functions for common tracking scenarios
export const trackAuthPageView = (page: 'signin' | 'error', metadata: Record<string, any> = {}) => {
  authAnalytics.trackPageView(page, undefined, metadata);
};

export const trackProviderClick = (provider: string, correlationId?: string) => {
  authAnalytics.trackInteraction('provider_clicked', provider, correlationId);
};

export const trackAuthError = (
  error: string, 
  errorType: 'network' | 'oauth' | 'validation' | 'timeout' | 'unknown',
  provider?: string
) => {
  authAnalytics.trackError(error, errorType, provider);
};

export const trackAuthSuccess = (provider: string, userId: string, correlationId?: string) => {
  authAnalytics.trackAuthComplete(true, provider, userId, correlationId);
};

export const trackAuthFailure = (provider: string, errorType: string, correlationId?: string) => {
  authAnalytics.trackAuthComplete(false, provider, undefined, correlationId, errorType);
};
