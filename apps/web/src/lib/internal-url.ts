/**
 * Utility for getting the correct base URL for internal API calls
 * Prevents SSL certificate errors in local development
 */
export function getInternalBaseUrl(): string {
  // In development, always use localhost to avoid SSL issues
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // In production, use the configured NEXTAUTH_URL
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

/**
 * Make internal API call with proper URL handling
 */
export async function internalFetch(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getInternalBaseUrl();
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  
  console.log(`🔗 Internal API call: ${url}`);
  
  return fetch(url, {
    ...options,
    // Add development-specific options
    ...(process.env.NODE_ENV === 'development' ? {
      // Don't validate SSL certificates in development
      agent: false
    } : {})
  });
}