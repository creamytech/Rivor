// Simple polyfills for server-side rendering compatibility
// Using .js extension to avoid TypeScript processing issues

if (typeof window === 'undefined') {
  // Core browser globals
  global.window = undefined;
  global.document = undefined;
  global.self = global;
  global.navigator = undefined;
  global.location = undefined;
  
  // Essential DOM constructors
  global.HTMLElement = class HTMLElement {};
  global.Element = class Element {};
  global.Node = class Node {};
  global.Document = class Document {};
  
  // Essential browser APIs
  global.getComputedStyle = () => ({});
  global.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  });
  
  // Modern Web APIs
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  // Storage APIs
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
  };
  
  global.sessionStorage = global.localStorage;
}