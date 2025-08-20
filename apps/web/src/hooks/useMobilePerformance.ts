"use client";

import { useEffect, useState } from 'react';

interface MobilePerformanceOptions {
  enableLazyLoading?: boolean;
  enableImageOptimization?: boolean;
  enableReducedMotion?: boolean;
  enableMemoryOptimization?: boolean;
}

export function useMobilePerformance(options: MobilePerformanceOptions = {}) {
  const {
    enableLazyLoading = true,
    enableImageOptimization = true,
    enableReducedMotion = true,
    enableMemoryOptimization = true,
  } = options;

  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [networkSpeed, setNetworkSpeed] = useState<'fast' | 'slow' | 'offline'>('fast');
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  // Detect device capabilities
  useEffect(() => {
    const detectDeviceCapabilities = () => {
      if (typeof navigator === 'undefined') return;

      // Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 1;
      
      // Check device memory if available
      const deviceMemory = (navigator as any).deviceMemory || 4;
      
      // Check connection speed
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType || '4g';
      
      // Determine if device is low-end
      const lowEnd = cores <= 2 || deviceMemory <= 2 || effectiveType === 'slow-2g' || effectiveType === '2g';
      setIsLowEndDevice(lowEnd);
      
      // Set network speed
      if (!navigator.onLine) {
        setNetworkSpeed('offline');
      } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        setNetworkSpeed('slow');
      } else {
        setNetworkSpeed('fast');
      }
    };

    detectDeviceCapabilities();

    // Listen for network changes
    const handleOnline = () => setNetworkSpeed('fast');
    const handleOffline = () => setNetworkSpeed('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor memory usage
  useEffect(() => {
    if (!enableMemoryOptimization) return;

    const updateMemoryInfo = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enableMemoryOptimization]);

  // Apply performance optimizations
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    const html = document.documentElement;

    // Apply low-end device optimizations
    if (isLowEndDevice) {
      body.classList.add('low-end-device');
      
      // Disable expensive CSS effects
      html.style.setProperty('--enable-backdrop-filter', 'none');
      html.style.setProperty('--enable-box-shadow', 'none');
      html.style.setProperty('--enable-transforms', 'none');
    } else {
      body.classList.remove('low-end-device');
      html.style.removeProperty('--enable-backdrop-filter');
      html.style.removeProperty('--enable-box-shadow');
      html.style.removeProperty('--enable-transforms');
    }

    // Apply network-based optimizations
    if (networkSpeed === 'slow') {
      body.classList.add('slow-network');
    } else {
      body.classList.remove('slow-network');
    }

    if (networkSpeed === 'offline') {
      body.classList.add('offline');
    } else {
      body.classList.remove('offline');
    }

    return () => {
      body.classList.remove('low-end-device', 'slow-network', 'offline');
    };
  }, [isLowEndDevice, networkSpeed]);

  // Enable reduced motion if preferred
  useEffect(() => {
    if (!enableReducedMotion) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.body.classList.add('reduce-motion');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    };

    handleChange(mediaQuery as any);
    mediaQuery.addListener(handleChange);

    return () => mediaQuery.removeListener(handleChange);
  }, [enableReducedMotion]);

  // Lazy loading optimization
  useEffect(() => {
    if (!enableLazyLoading) return;

    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });

    images.forEach(img => imageObserver.observe(img));

    return () => imageObserver.disconnect();
  }, [enableLazyLoading]);

  // Memory cleanup
  useEffect(() => {
    if (!enableMemoryOptimization) return;

    const cleanup = () => {
      // Force garbage collection if available (dev mode)
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Clear unused event listeners
      const body = document.body;
      const clone = body.cloneNode(true);
      body.parentNode?.replaceChild(clone, body);
    };

    // Cleanup on high memory usage
    if (memoryInfo && memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.9) {
      cleanup();
    }
  }, [memoryInfo, enableMemoryOptimization]);

  return {
    isLowEndDevice,
    networkSpeed,
    memoryInfo,
    shouldReduceAnimations: isLowEndDevice || networkSpeed === 'slow',
    shouldOptimizeImages: networkSpeed === 'slow' || isLowEndDevice,
    shouldLazyLoad: enableLazyLoading,
  };
}

// Hook for image optimization based on device capabilities
export function useImageOptimization() {
  const { isLowEndDevice, networkSpeed } = useMobilePerformance();
  
  const getOptimizedImageProps = (src: string, alt: string) => {
    const shouldOptimize = isLowEndDevice || networkSpeed === 'slow';
    
    return {
      src: shouldOptimize ? src.replace(/\.(jpg|jpeg|png)$/i, '.webp') : src,
      alt,
      loading: 'lazy' as const,
      decoding: 'async' as const,
      ...(shouldOptimize && {
        sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      })
    };
  };

  return { getOptimizedImageProps };
}

// Hook for battery-aware performance
export function useBatteryOptimization() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);

  useEffect(() => {
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);

          const updateBatteryInfo = () => {
            setBatteryLevel(battery.level);
            setIsCharging(battery.charging);
          };

          battery.addEventListener('levelchange', updateBatteryInfo);
          battery.addEventListener('chargingchange', updateBatteryInfo);

          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo);
            battery.removeEventListener('chargingchange', updateBatteryInfo);
          };
        } catch (error) {
          console.log('Battery API not available');
        }
      }
    };

    getBatteryInfo();
  }, []);

  const shouldReducePerformance = batteryLevel !== null && batteryLevel < 0.2 && !isCharging;

  useEffect(() => {
    if (shouldReducePerformance) {
      document.body.classList.add('battery-saver');
    } else {
      document.body.classList.remove('battery-saver');
    }
  }, [shouldReducePerformance]);

  return {
    batteryLevel,
    isCharging,
    shouldReducePerformance,
  };
}