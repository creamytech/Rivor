import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth-minimal';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Testing minimal auth configuration');
    
    const session = await auth();
    
    return NextResponse.json({
      success: true,
      session: {
        found: !!session,
        user: session?.user || null
      },
      message: session ? 'Minimal auth working!' : 'Minimal auth still not working',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Minimal auth test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}