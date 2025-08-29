import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { signature } = body;

    if (!signature || signature.trim().length === 0) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Find or create the user's primary email account to store signature
    let emailAccount = await prisma.emailAccount.findFirst({
      where: {
        userId: session.user.id,
        orgId: orgId
      }
    });

    if (!emailAccount) {
      // Create a placeholder email account for signature storage
      emailAccount = await prisma.emailAccount.create({
        data: {
          userId: session.user.id,
          orgId: orgId,
          email: session.user.email || '',
          provider: 'manual',
          externalAccountId: `manual-${session.user.id}`,
          status: 'draft', // Not connected to actual email
          signatureStyle: signature
        }
      });
    } else {
      // Update existing email account with signature
      emailAccount = await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: { signatureStyle: signature }
      });
    }

    return NextResponse.json({
      success: true,
      signatureUpdated: true
    });
  } catch (error) {
    console.error('Email signature update error:', error);
    return NextResponse.json(
      { error: 'Failed to update email signature' },
      { status: 500 }
    );
  }
}