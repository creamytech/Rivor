import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    console.log('🔧 Fixing OAuth linking for:', email);

    // Find user and check their accounts
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    });

    if (!user) {
      return NextResponse.json({ 
        message: 'No user found with that email',
        canSignIn: true 
      });
    }

    console.log('👤 Found user:', {
      id: user.id,
      email: user.email,
      accountCount: user.accounts.length
    });

    // If user has no accounts, this is the OAuthAccountNotLinked issue
    if (user.accounts.length === 0) {
      console.log('🔗 User has no linked accounts, deleting user to allow fresh signup');
      
      // Delete the user record so OAuth can create a fresh one
      await prisma.user.delete({
        where: { id: user.id }
      });

      return NextResponse.json({
        success: true,
        message: 'Deleted orphaned user record',
        action: 'User can now sign in fresh with OAuth',
        userId: user.id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User already has linked accounts',
      accountCount: user.accounts.length,
      accounts: user.accounts.map(acc => ({
        provider: acc.provider,
        createdAt: acc.createdAt
      }))
    });

  } catch (error) {
    console.error('Fix OAuth error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}