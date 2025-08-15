/**
 * Structured logging utility for Rivor
 * Provides consistent logging with request correlation IDs and user context
 */

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  orgId?: string;
  action?: string;
  resource?: string;
  error?: string;
  // Google integration fields
  channelId?: string;
  resourceId?: string;
  state?: string;
  provider?: string;
  emailAddress?: string;
  historyId?: string;
  emailAccountId?: string;
  calendarAccountId?: string;
  accountId?: string;
  topicName?: string;
  expiration?: string | Date;
  expiresAt?: string | Date;
  latency?: number;
  duration?: number;
  force?: boolean;
  hasData?: boolean;
  attributes?: unknown;
  notificationData?: unknown;
  skipValidation?: boolean;
  gmailSuccess?: boolean;
  calendarSuccess?: boolean;
  tokensValid?: boolean;
  accountCount?: number;
  connectedCount?: number;
  scheduledCount?: number;
  orgCount?: number;
  // Allow any additional fields
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: string;
}

class Logger {
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  private createLogEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      ...context
    };
  }

  private log(level: LogLevel, message: string, context: LogContext = {}) {
    const entry = this.createLogEntry(level, message, this.redactSensitiveData(context));
    
    // In development, use console with nice formatting
    if (this.environment === 'development') {
      const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : '';
      console[level === 'debug' ? 'log' : level](`[${level.toUpperCase()}] ${message}`, contextStr);
    } else {
      // In production, log structured JSON for log aggregation
      console.log(JSON.stringify(entry));
    }
  }

  private redactSensitiveData(context: LogContext): LogContext {
    const redacted = { ...context };
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'accessToken', 'refreshToken', 'idToken', 'sessionToken'
    ];
    
    // Redact sensitive fields
    for (const key of Object.keys(redacted)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        redacted[key] = '[REDACTED]';
      }
      
      // Hash email addresses for privacy while keeping them trackable
      if ((key === 'userId' || key === 'emailAddress') && typeof redacted[key] === 'string') {
        redacted[key] = this.hashEmail(redacted[key] as string);
      }
    }
    
    return redacted;
  }

  private hashEmail(email: string): string {
    if (!email || typeof email !== 'string' || !email.includes('@')) return '[REDACTED]';
    
    // Keep first 2 chars and domain for debugging while protecting PII
    const [local, domain] = email.split('@');
    if (!local || !domain) return '[REDACTED]';
    
    const hashedLocal = local.length > 2 
      ? local.substring(0, 2) + '***' 
      : '***';
    
    return `${hashedLocal}@${domain}`;
  }

  debug(message: string, context: LogContext = {}) {
    this.log('debug', message, context);
  }

  info(message: string, context: LogContext = {}) {
    this.log('info', message, context);
  }

  warn(message: string, context: LogContext = {}) {
    this.log('warn', message, context);
  }

  error(message: string, context: LogContext = {}) {
    this.log('error', message, context);
  }

  // Specific logging methods for common use cases
  userAction(action: string, userId: string, orgId: string, metadata: Record<string, unknown> = {}) {
    this.info(`User action: ${action}`, {
      action,
      userId,
      orgId,
      metadata
    });
  }

  dataFetch(resource: string, success: boolean, orgId: string, metadata: Record<string, unknown> = {}) {
    const message = `Data fetch ${success ? 'successful' : 'failed'}: ${resource}`;
    if (success) {
      this.info(message, { resource, orgId, metadata });
    } else {
      this.error(message, { resource, orgId, metadata });
    }
  }

  authEvent(event: string, userId: string, provider: string, success: boolean, metadata: Record<string, unknown> = {}) {
    const message = `Auth ${event}: ${success ? 'success' : 'failure'}`;
    const level = success ? 'info' : 'warn';
    this[level](message, {
      action: `auth_${event}`,
      userId,
      provider,
      success,
      correlationId: metadata.correlationId || this.generateCorrelationId(),
      metadata: { ...metadata, provider, success }
    });
  }

  // Security-specific logging methods
  securityEvent(
    event: 'rate_limit_exceeded' | 'invalid_origin' | 'csrf_attempt' | 'suspicious_activity' | 'token_manipulation',
    details: LogContext = {}
  ) {
    this.warn(`Security event: ${event}`, {
      action: 'security_event',
      event,
      severity: 'medium',
      requiresReview: true,
      correlationId: this.generateCorrelationId(),
      ...details
    });
  }

  rateLimitEvent(identifier: string, attempts: number, windowMs: number, ip?: string) {
    this.warn('Rate limit exceeded', {
      action: 'rate_limit_exceeded',
      identifier: this.hashEmail(identifier), // Hash for privacy
      attempts,
      windowMs,
      ip: ip ? this.hashIP(ip) : undefined,
      correlationId: this.generateCorrelationId()
    });
  }

  private hashIP(ip: string): string {
    // Hash IP while keeping some structure for debugging
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***.***`;
    }
    return '***';
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  apiRequest(method: string, path: string, userId?: string, orgId?: string, statusCode?: number, duration?: number) {
    const message = `API ${method} ${path} - ${statusCode || 'unknown'}`;
    this.info(message, {
      action: 'api_request',
      userId,
      orgId,
      metadata: {
        method,
        path,
        statusCode,
        duration
      }
    });
  }
}

export const logger = new Logger();

// Middleware helper for request correlation
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Error tracking helper
export function logError(error: Error | unknown, context: LogContext = {}) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  logger.error(errorMessage, {
    ...context,
    metadata: {
      ...context.metadata,
      stack,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    }
  });
}
