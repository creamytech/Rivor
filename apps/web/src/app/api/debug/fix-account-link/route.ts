import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Fix OAuthAccountNotLinked error by creating missing User and Account records
 */
export async function POST(req: NextRequest) {
  try {
    const { email, provider = 'google' } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    });

    if (!user) {
      // Create the missing User record
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0], // Use email prefix as name
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: { accounts: true }
      });
    }

    // Check if Account record exists for this provider
    const existingAccount = user.accounts.find(acc => acc.provider === provider);
    
    if (!existingAccount) {
      // Note: We can't create a real Account record without OAuth tokens
      // The user needs to go through OAuth flow to get tokens
      return NextResponse.json({
        message: 'User record created, but Account record needs OAuth flow',
        action: 'user_created_needs_oauth',
        userId: user.id,
        email: user.email,
        nextSteps: [
          'User record has been created in the database',
          'You still need to complete OAuth flow to create Account record',
          'Clear your browser cookies and try signing in again',
          'This should now work since User record exists'
        ]
      });
    }

    return NextResponse.json({
      message: 'User and Account records already exist',
      action: 'already_exists',
      userId: user.id,
      accountProvider: existingAccount.provider
    });

  } catch (error: unknown) {
    console.error('Fix account link error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix account link',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
