import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Get listings for the organization
 */
export async function GET(req: NextRequest) {
  try {
    // Development bypass - return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockListings = [
        {
          id: 'mock-1',
          address: '123 Main St, Austin, TX 78701',
          price: '$750,000',
          beds: '3',
          baths: '2.5',
          sqft: '2,100',
          description: 'Beautiful modern home with updated kitchen and spacious backyard. Perfect for families.',
          status: 'active',
          listingType: 'sale',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'mock-2',
          address: '456 Oak Ave, Dallas, TX 75201',
          price: '$525,000',
          beds: '2',
          baths: '2',
          sqft: '1,800',
          description: 'Charming downtown condo with city views and modern amenities.',
          status: 'pending',
          listingType: 'sale',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      return NextResponse.json({
        listings: mockListings,
        total: mockListings.length
      });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // For now, return empty array since we don't have a listings table
    // This would be where you'd query your listings table
    const listings: any[] = [];

    return NextResponse.json({
      listings,
      total: listings.length
    });

  } catch (error: unknown) {
    console.error('Listings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

/**
 * Create new listing
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await req.json();
    const {
      address,
      price,
      beds,
      baths,
      sqft,
      description
    } = body;

    if (!address || !price) {
      return NextResponse.json(
        { error: 'Address and price are required' },
        { status: 400 }
      );
    }

    // For now, just return a success response with the data
    // In a real implementation, you'd save this to a listings table
    const listing = {
      id: `listing_${Date.now()}`,
      address,
      price,
      beds: beds || '0',
      baths: baths || '0',
      sqft: sqft || '0',
      description: description || '',
      status: 'active',
      listingType: 'sale',
      orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Log the listing creation for now
    console.log('New listing created:', listing);

    return NextResponse.json({
      success: true,
      listing
    });

  } catch (error: unknown) {
    console.error('Listing creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}