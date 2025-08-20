import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { aiService as AIService } from '@/server/ai/ai-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, threadId, context } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await AIService.sendMessage(message, threadId, context);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Provide more specific error details
    let errorMessage = 'Failed to process chat message';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

