import { getEnv } from './env';

export interface PropertySearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
}

const MLS_API_URL = 'https://api.example-mls.com/properties';

/**
 * Query the MLS API for property listings with the given filters.
 */
export async function searchProperties(filters: PropertySearchFilters) {
  const { MLS_API_KEY } = getEnv() as { MLS_API_KEY?: string };
  if (!MLS_API_KEY) {
    throw new Error('MLS_API_KEY is not configured');
  }

  const params = new URLSearchParams();
  if (filters.location) params.append('location', filters.location);
  if (filters.minPrice) params.append('min_price', String(filters.minPrice));
  if (filters.maxPrice) params.append('max_price', String(filters.maxPrice));
  if (filters.beds) params.append('beds', String(filters.beds));

  const res = await fetch(`${MLS_API_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${MLS_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`MLS API request failed with ${res.status}`);
  }

  const data = await res.json();
  return data.listings ?? data;
}

