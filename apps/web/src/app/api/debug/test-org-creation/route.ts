import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Testing org creation');
    
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated session',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Check if org already exists
    const existingOrg = await prisma.org.findFirst({
      where: { 
        OR: [
          { name: user.email },
          { ownerUserId: user.id }
        ]
      }
    });

    if (existingOrg) {
      return NextResponse.json({
        success: true,
        message: 'Org already exists',
        org: {
          id: existingOrg.id,
          name: existingOrg.name,
          slug: existingOrg.slug,
          ownerUserId: existingOrg.ownerUserId
        },
        timestamp: new Date().toISOString()
      });
    }

    // Try to create org with minimal data
    const slug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    const dummyBlob = Buffer.from(new Uint8Array(32)); // Simple dummy encrypted blob

    console.log('Creating org with:', {
      name: user.email,
      slug,
      ownerUserId: user.id,
      encryptedDekBlob: dummyBlob.length + ' bytes'
    });

    const newOrg = await prisma.org.create({
      data: {
        name: user.email,
        slug,
        ownerUserId: user.id,
        encryptedDekBlob: dummyBlob,
        retentionDays: 365,
      },
    });

    console.log('✅ Org created:', newOrg);

    // Create org member
    const orgMember = await prisma.orgMember.create({
      data: {
        orgId: newOrg.id,
        userId: user.id,
        role: 'owner',
      },
    });

    console.log('✅ OrgMember created:', orgMember);

    return NextResponse.json({
      success: true,
      message: 'Org created successfully',
      org: {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
        ownerUserId: newOrg.ownerUserId,
        createdAt: newOrg.createdAt
      },
      orgMember: {
        id: orgMember.id,
        role: orgMember.role
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test org creation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}