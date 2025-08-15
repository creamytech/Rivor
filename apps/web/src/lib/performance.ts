// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Core Web Vitals tracking
  trackCLS(value: number): void {
    this.metrics.set('cls', value);
    if (value > 0.1) {
      console.warn('CLS threshold exceeded:', value);
    }
  }

  trackFID(value: number): void {
    this.metrics.set('fid', value);
    if (value > 100) {
      console.warn('FID threshold exceeded:', value);
    }
  }

  trackLCP(value: number): void {
    this.metrics.set('lcp', value);
    if (value > 2500) {
      console.warn('LCP threshold exceeded:', value);
    }
  }

  trackTTFB(value: number): void {
    this.metrics.set('ttfb', value);
    if (value > 800) {
      console.warn('TTFB threshold exceeded:', value);
    }
  }

  // Custom performance tracking
  startTiming(name: string): void {
    performance.mark(`${name}-start`);
  }

  endTiming(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    const duration = measure.duration;
    
    this.metrics.set(name, duration);
    return duration;
  }

  // Bundle size tracking
  trackBundleSize(name: string, size: number): void {
    this.metrics.set(`bundle-${name}`, size);
    
    // Warn if bundle exceeds recommended sizes
    if (name === 'main' && size > 250000) { // 250KB
      console.warn('Main bundle size exceeded 250KB:', size);
    }
  }

  // Memory usage tracking
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as unknown).memory;
      this.metrics.set('heap-used', memory.usedJSHeapSize);
      this.metrics.set('heap-total', memory.totalJSHeapSize);
      this.metrics.set('heap-limit', memory.jsHeapSizeLimit);
      
      // Warn if memory usage is high
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        console.warn('High memory usage detected:', usagePercent.toFixed(2) + '%');
      }
    }
  }

  // API response time tracking
  trackAPIRequest(endpoint: string, duration: number, status: number): void {
    this.metrics.set(`api-${endpoint}`, duration);
    
    if (duration > 1000) {
      console.warn(`Slow API response for ${endpoint}:`, duration + 'ms');
    }
    
    if (status >= 400) {
      console.error(`API error for ${endpoint}:`, status);
    }
  }

  // Get all metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Report performance data
  report(): void {
    const metrics = this.getMetrics();
    
    // Log summary
    console.group('Performance Report');
    console.table(metrics);
    console.groupEnd();
    
    // Send to analytics service (mock)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metrics);
    }
  }

  private sendToAnalytics(metrics: Record<string, number>): void {
    // Mock analytics reporting
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        metrics
      })
    }).catch(err => console.error('Failed to send performance data:', err));
  }
}

// Utility functions
export const performanceMonitor = PerformanceMonitor.getInstance();

export function withPerformanceTracking<T extends (...args: unknown[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: unknown[]) => {
    performanceMonitor.startTiming(name);
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        performanceMonitor.endTiming(name);
      });
    } else {
      performanceMonitor.endTiming(name);
      return result;
    }
  }) as T;
}

// Web Vitals observer setup
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Import web-vitals dynamically
  import('web-vitals').then((webVitals) => {
    if (webVitals.onCLS) {
      webVitals.onCLS(({ value }) => performanceMonitor.trackCLS(value));
    }
    if (webVitals.onINP) {
      webVitals.onINP(({ value }) => performanceMonitor.trackFID(value));
    }
    if (webVitals.onLCP) {
      webVitals.onLCP(({ value }) => performanceMonitor.trackLCP(value));
    }
    if (webVitals.onTTFB) {
      webVitals.onTTFB(({ value }) => performanceMonitor.trackTTFB(value));
    }
  }).catch(err => console.error('Failed to load web-vitals:', err));
}
