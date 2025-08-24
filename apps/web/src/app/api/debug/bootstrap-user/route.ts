import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const userName = session.user.name;
    const userImage = session.user.image;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        orgMembers: {
          include: { org: true }
        }
      }
    });

    if (!user) {
      console.log('Creating new user:', userEmail);
      
      // Create user
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          image: userImage,
          emailVerified: new Date(), // Mark as verified since they logged in with Google
        },
        include: {
          orgMembers: {
            include: { org: true }
          }
        }
      });
    }

    // Check if user has org membership
    let org;
    if (user.orgMembers.length === 0) {
      console.log('User has no org membership, checking for default org');
      
      // Check if default org exists
      org = await prisma.org.findFirst({
        where: { id: 'default' }
      });
      
      if (!org) {
        console.log('Creating default org');
        
        // Create default org with proper encryption setup
        // Generate a simple encryption key blob for demo purposes
        const dummyEncryptionBlob = Buffer.from('dummy-encryption-key-for-demo-purposes');
        
        org = await prisma.org.create({
          data: {
            id: 'default',
            name: 'Default Organization',
            slug: 'default',
            ownerUserId: user.id,
            encryptedDekBlob: dummyEncryptionBlob,
            dekVersion: 1,
            ephemeralMode: true, // Enable ephemeral mode for demo
            retentionDays: 90
          }
        });
      }
      
      // Add user to org
      await prisma.orgMember.create({
        data: {
          orgId: org.id,
          userId: user.id,
          role: 'owner'
        }
      });
      
      console.log('Added user to org:', org.id);
    } else {
      org = user.orgMembers[0].org;
    }

    // Refresh user data
    user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        accounts: true,
        oauthAccounts: true,
        emailAccounts: true,
        orgMembers: {
          include: { org: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User and org setup completed',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orgId: org.id,
        accounts: user.accounts.length,
        oauthAccounts: user.oauthAccounts.length,
        emailAccounts: user.emailAccounts.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bootstrap user error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}