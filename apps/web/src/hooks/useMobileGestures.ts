"use client";

import { useEffect, useRef, RefObject } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TapHandlers {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

interface MobileGestureOptions extends SwipeHandlers, TapHandlers {
  threshold?: number; // Minimum distance for swipe
  velocity?: number;  // Minimum velocity for swipe
  longPressDelay?: number; // Delay for long press
}

export function useMobileGestures<T extends HTMLElement>(
  ref: RefObject<T>,
  options: MobileGestureOptions = {}
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    threshold = 50,
    velocity = 0.3,
    longPressDelay = 500,
  } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };

        // Start long press timer
        if (onLongPress) {
          longPressTimer.current = setTimeout(() => {
            onLongPress();
          }, longPressDelay);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press on move
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Cancel long press
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (e.changedTouches.length === 1 && touchStart.current) {
        const touch = e.changedTouches[0];
        touchEnd.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };

        const deltaX = touchEnd.current.x - touchStart.current.x;
        const deltaY = touchEnd.current.y - touchStart.current.y;
        const deltaTime = touchEnd.current.time - touchStart.current.time;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocityVal = distance / deltaTime;

        // Check for swipe gestures
        if (distance > threshold && velocityVal > velocity) {
          const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * 180 / Math.PI;

          if (angle < 45) {
            // Horizontal swipe
            if (deltaX > 0 && onSwipeRight) {
              onSwipeRight();
            } else if (deltaX < 0 && onSwipeLeft) {
              onSwipeLeft();
            }
          } else {
            // Vertical swipe
            if (deltaY > 0 && onSwipeDown) {
              onSwipeDown();
            } else if (deltaY < 0 && onSwipeUp) {
              onSwipeUp();
            }
          }
        } else if (distance < 10 && deltaTime < 300) {
          // Tap gesture
          tapCount.current += 1;

          if (tapTimer.current) {
            clearTimeout(tapTimer.current);
          }

          tapTimer.current = setTimeout(() => {
            if (tapCount.current === 1 && onTap) {
              onTap();
            } else if (tapCount.current === 2 && onDoubleTap) {
              onDoubleTap();
            }
            tapCount.current = 0;
          }, 300);
        }

        touchStart.current = null;
        touchEnd.current = null;
      }
    };

    // Add passive listeners for better performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
    };
  }, [ref, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, onLongPress, threshold, velocity, longPressDelay]);
}

// Hook for detecting mobile device and capabilities
export function useMobileDetection() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;
  const hasHoverCapability = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);
  const isStandalone = typeof window !== 'undefined' && (window.navigator as any).standalone === true;

  return {
    isMobile,
    isTouchDevice,
    hasHoverCapability,
    isIOS,
    isAndroid,
    isStandalone,
  };
}

// Hook for handling mobile keyboard visibility
export function useMobileKeyboard() {
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const viewport = window.visualViewport;
        if (viewport) {
          // Handle keyboard show/hide
          const keyboardHeight = window.innerHeight - viewport.height;
          if (keyboardHeight > 150) {
            document.body.classList.add('keyboard-open');
            document.body.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
          } else {
            document.body.classList.remove('keyboard-open');
            document.body.style.removeProperty('--keyboard-height');
          }
        }
      }
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    }
  }, []);
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 100) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isRefreshing = useRef(false);

  useMobileGestures(containerRef, {
    onSwipeDown: async () => {
      if (containerRef.current && containerRef.current.scrollTop === 0 && !isRefreshing.current) {
        isRefreshing.current = true;
        try {
          await onRefresh();
        } finally {
          isRefreshing.current = false;
        }
      }
    },
    threshold,
  });

  return containerRef;
}

// Hook for mobile-specific scroll behavior
export function useMobileScroll() {
  useEffect(() => {
    // Enable smooth scrolling on mobile
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        document.documentElement.style.scrollBehavior = 'smooth';
        document.body.style.overscrollBehavior = 'contain';
        
        // Prevent bounce scrolling on iOS
        document.addEventListener('touchstart', (e) => {
          if (e.touches.length > 1) {
            e.preventDefault();
          }
        }, { passive: false });

        document.addEventListener('gesturestart', (e) => {
          e.preventDefault();
        });
      }
    }
  }, []);
}