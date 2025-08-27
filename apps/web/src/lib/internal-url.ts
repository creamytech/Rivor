/**
 * Utility for getting the correct base URL for internal API calls
 * Prevents SSL certificate errors in local development
 */
export function getInternalBaseUrl(): string {
  // In development, always use localhost to avoid SSL issues
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // In production, determine the correct base URL
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }
  
  // Server-side: use configured URL or fallback
  return process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.rivor.ai';
}

/**
 * Make internal API call with proper URL handling
 */
export async function internalFetch(endpoint: string, options: RequestInit = {}) {
  // For client-side calls, use relative URLs to avoid CORS issues
  if (typeof window !== 'undefined') {
    console.log(`🔗 Client-side API call: ${endpoint}`);
    return fetch(endpoint, options);
  }
  
  // For server-side calls, construct full URL
  const baseUrl = getInternalBaseUrl();
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  
  console.log(`🔗 Server-side API call: ${url}`);
  
  return fetch(url, {
    ...options,
    // Add development-specific options
    ...(process.env.NODE_ENV === 'development' ? {
      // Don't validate SSL certificates in development
      agent: false
    } : {})
  });
}