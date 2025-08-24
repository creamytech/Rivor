import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'To disable custom adapter, comment out the custom adapter import in auth.ts and use PrismaAdapter directly',
    instructions: [
      '1. Edit /apps/web/src/server/auth.ts',
      '2. Change: adapter: createCustomPrismaAdapter(),',  
      '3. To: adapter: PrismaAdapter(prisma),',
      '4. This will use default PrismaAdapter without custom encryption',
      '5. Test if session works, then we know the issue is in custom adapter'
    ],
    note: 'This is for debugging only - tokens will be stored in plain text temporarily'
  });
}