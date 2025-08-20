// Polyfills for server-side rendering compatibility

// Fix for 'self is not defined' error
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis as any;
  }
}

// Node.js environment polyfills
if (typeof window === 'undefined') {
  // Define browser globals for server-side compatibility
  (global as any).window = undefined;
  (global as any).document = undefined;
  (global as any).self = global;
  (global as any).navigator = undefined;
  (global as any).location = undefined;
  
  // Mock browser APIs that might be used by client-side libraries
  (global as any).HTMLElement = class HTMLElement {};
  (global as any).Element = class Element {};
  (global as any).Node = class Node {};
  
  // Mock DOM methods
  (global as any).getComputedStyle = () => ({});
  (global as any).matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  });
  
  // Mock Web APIs
  (global as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  (global as any).IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Export for explicit imports if needed
export const isServer = typeof window === 'undefined';
export const isBrowser = typeof window !== 'undefined';

// Safe access to browser APIs
export const safeWindow = typeof window !== 'undefined' ? window : undefined;
export const safeDocument = typeof document !== 'undefined' ? document : undefined;
export const safeNavigator = typeof navigator !== 'undefined' ? navigator : undefined;