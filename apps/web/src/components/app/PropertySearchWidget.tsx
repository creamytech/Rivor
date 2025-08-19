"use client";

import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Property {
  id?: string;
  address?: string;
  price?: number;
  beds?: number;
}

export default function PropertySearchWidget() {
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [beds, setBeds] = useState('');
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  async function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (beds) params.set('beds', beds);
    const res = await fetch(`/api/mls?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  return (
    <GlassCard className="h-full flex flex-col" data-card-id="propertySearch">
      <GlassCardHeader>
        <GlassCardTitle>Property Search</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4 overflow-auto">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          <Input placeholder="Beds" type="number" value={beds} onChange={e => setBeds(e.target.value)} />
          <Input placeholder="Min Price" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          <Input placeholder="Max Price" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={search} disabled={loading} className="flex-1">
            {loading ? 'Searching...' : 'Search'}
          </Button>
          <Button variant="outline" onClick={() => setShowMap(!showMap)}>
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
        </div>
        <ul className="space-y-2">
          {results.map((p, i) => (
            <li key={i} className="text-sm">
              <div className="font-medium">{p.address ?? 'Unknown Address'}</div>
              <div>
                {p.price ? `$${p.price.toLocaleString()}` : 'N/A'}
                {p.beds ? ` · ${p.beds} beds` : ''}
              </div>
            </li>
          ))}
        </ul>
        {showMap && (
          <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
            Map placeholder
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}

