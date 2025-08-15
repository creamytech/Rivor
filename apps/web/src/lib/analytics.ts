// Analytics and Conversion Tracking
// Supports GA4, Mixpanel, and PostHog

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    mixpanel?: unknown;
    posthog?: unknown;
  }
}

export interface TrackingEvent {
  name: string;
  properties?: Record<string, unknown>;
  value?: number;
}

export interface ConversionEvent extends TrackingEvent {
  conversionType: 'signup' | 'demo_request' | 'trial_start' | 'contact' | 'pricing_view';
  source?: string;
  medium?: string;
  campaign?: string;
}

// Event tracking functions
export const trackEvent = (event: TrackingEvent) => {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event.name, {
      ...event.properties,
      value: event.value,
    });
  }

  // Mixpanel
  if (typeof window !== 'undefined' && window.mixpanel) {
    window.mixpanel.track(event.name, {
      ...event.properties,
      value: event.value,
    });
  }

  // PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event.name, {
      ...event.properties,
      value: event.value,
    });
  }

  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  }
};

// Conversion-specific tracking
export const trackConversion = (event: ConversionEvent) => {
  trackEvent({
    name: `conversion_${event.conversionType}`,
    properties: {
      conversion_type: event.conversionType,
      source: event.source,
      medium: event.medium,
      campaign: event.campaign,
      ...event.properties,
    },
    value: event.value,
  });
};

// CTA click tracking
export const trackCTAClick = (cta: string, location: string, destination: string) => {
  trackEvent({
    name: 'cta_click',
    properties: {
      cta_text: cta,
      cta_location: location,
      destination,
      timestamp: new Date().toISOString(),
    },
  });
};

// Scroll depth tracking
export const initScrollTracking = () => {
  if (typeof window === 'undefined') return;

  const scrollDepths = [25, 50, 75, 90, 100];
  const tracked = new Set<number>();

  const handleScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    scrollDepths.forEach(depth => {
      if (scrollPercent >= depth && !tracked.has(depth)) {
        tracked.add(depth);
        trackEvent({
          name: 'scroll_depth',
          properties: {
            depth: depth,
            page: window.location.pathname,
          },
        });
      }
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', onScroll);
  };
};

// Time on page tracking
export const initTimeTracking = () => {
  if (typeof window === 'undefined') return;

  const startTime = Date.now();
  const milestones = [30, 60, 120, 300]; // seconds
  const tracked = new Set<number>();

  const checkTimeOnPage = () => {
    const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
    
    milestones.forEach(milestone => {
      if (timeOnPage >= milestone && !tracked.has(milestone)) {
        tracked.add(milestone);
        trackEvent({
          name: 'time_on_page',
          properties: {
            seconds: milestone,
            page: window.location.pathname,
          },
        });
      }
    });
  };

  const interval = setInterval(checkTimeOnPage, 5000);
  
  return () => {
    clearInterval(interval);
  };
};

// UTM parameter capture
export const captureUTMParams = () => {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {
    source: urlParams.get('utm_source'),
    medium: urlParams.get('utm_medium'),
    campaign: urlParams.get('utm_campaign'),
    term: urlParams.get('utm_term'),
    content: urlParams.get('utm_content'),
  };

  // Store in session storage for later use
  if (Object.values(utmParams).some(value => value !== null)) {
    sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
  }

  return utmParams;
};

// Get stored UTM params
export const getStoredUTMParams = () => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = sessionStorage.getItem('utm_params');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Page view tracking
export const trackPageView = (path: string, title?: string) => {
  trackEvent({
    name: 'page_view',
    properties: {
      page_path: path,
      page_title: title || document.title,
      ...captureUTMParams(),
    },
  });
};

// Error tracking
export const trackError = (error: Error, context?: string) => {
  trackEvent({
    name: 'error',
    properties: {
      error_message: error.message,
      error_stack: error.stack,
      context,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
    },
  });
};
