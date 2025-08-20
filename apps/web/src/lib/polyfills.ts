// Polyfills for server-side rendering compatibility

// Check if we're in a server environment
const isServerEnvironment = typeof window === 'undefined';

if (isServerEnvironment) {
  // Core browser globals
  if (typeof globalThis !== 'undefined') {
    // Define on globalThis for better compatibility
    globalThis.window = undefined as any;
    globalThis.document = undefined as any;
    globalThis.self = globalThis;
    globalThis.navigator = undefined as any;
    globalThis.location = undefined as any;
  }
  
  // Also define on global for Node.js compatibility
  const g = global as any;
  g.window = undefined;
  g.document = undefined;
  g.self = global;
  g.navigator = undefined;
  g.location = undefined;
  
  // Mock essential DOM constructors
  g.HTMLElement = class HTMLElement {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    setAttribute() {}
    getAttribute() { return null; }
    removeAttribute() {}
  };
  
  g.Element = class Element extends g.HTMLElement {};
  g.Node = class Node {
    constructor() {}
    appendChild() {}
    removeChild() {}
    insertBefore() {}
  };
  
  g.Document = class Document extends g.Node {};
  
  // Mock essential browser APIs
  g.getComputedStyle = () => ({
    getPropertyValue: () => '',
    setProperty: () => {},
  });
  
  g.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
  
  // Mock modern Web APIs
  g.ResizeObserver = class ResizeObserver {
    constructor(callback: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  g.IntersectionObserver = class IntersectionObserver {
    constructor(callback: any, options?: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  g.MutationObserver = class MutationObserver {
    constructor(callback: any) {}
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
  
  // Mock Performance API
  g.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
  };
  
  // Mock Request/Response for fetch-like APIs
  g.Request = class Request {};
  g.Response = class Response {};
  g.Headers = class Headers {};
  
  // Mock Storage APIs
  g.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
  
  g.sessionStorage = g.localStorage;
}

// Export for explicit imports if needed  
export const isServer = isServerEnvironment;
export const isBrowser = !isServerEnvironment;

// Safe access to browser APIs
export const safeWindow = typeof window !== 'undefined' ? window : undefined;
export const safeDocument = typeof document !== 'undefined' ? document : undefined;
export const safeNavigator = typeof navigator !== 'undefined' ? navigator : undefined;