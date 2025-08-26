import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log('🕒 Auth timing check started at:', new Date().toISOString());
  
  try {
    // Test 1: Direct getServerSession call
    const sessionStart = Date.now();
    const session = await getServerSession(authOptions);
    const sessionTime = Date.now() - sessionStart;
    
    console.log('🕒 Session retrieval took:', sessionTime, 'ms');
    console.log('🔍 Session found:', !!session);
    console.log('🔍 User:', session?.user?.email);
    
    // Test 2: Check if this is an existing user
    let userStatus = 'unknown';
    if (session?.user?.email) {
      try {
        const { prisma } = await import('@/server/db');
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { 
            id: true, 
            email: true,
            createdAt: true,
            orgMembers: { select: { orgId: true } }
          }
        });
        
        if (user) {
          userStatus = user.orgMembers.length > 0 ? 'has_org' : 'no_org';
        } else {
          userStatus = 'no_user_record';
        }
      } catch (error) {
        console.error('Error checking user:', error);
        userStatus = 'db_error';
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      timing: {
        total: totalTime,
        sessionRetrieval: sessionTime,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString()
      },
      session: {
        found: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userName: session?.user?.name
      },
      userStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ Auth timing check failed after', totalTime, 'ms:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timing: {
        total: totalTime,
        failed: true
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}