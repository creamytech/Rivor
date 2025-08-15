"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  trackPageView, 
  initScrollTracking, 
  initTimeTracking,
  captureUTMParams 
} from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Capture UTM parameters on initial load
    captureUTMParams();

    // Initialize tracking
    const cleanupScroll = initScrollTracking();
    const cleanupTime = initTimeTracking();

    return () => {
      cleanupScroll?.();
      cleanupTime?.();
    };
  }, []);

  useEffect(() => {
    // Track page views
    trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}

// Hook for tracking CTA clicks
export function useTrackCTA() {
  return (ctaText: string, location: string, destination: string) => {
    // Import dynamically to avoid SSR issues
    import('@/lib/analytics').then(({ trackCTAClick }) => {
      trackCTAClick(ctaText, location, destination);
    });
  };
}

// Hook for tracking conversions
export function useTrackConversion() {
  return (conversionType: string, properties?: Record<string, any>) => {
    import('@/lib/analytics').then(({ trackConversion, getStoredUTMParams }) => {
      const utmParams = getStoredUTMParams();
      trackConversion({
        name: 'conversion',
        conversionType: conversionType as any,
        properties: {
          ...properties,
          ...utmParams,
        },
      });
    });
  };
}
