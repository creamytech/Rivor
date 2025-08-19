import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { aiService } from '@/server/ai/ai-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const context = req.nextUrl.searchParams.get('context');
    if (!context || !['pipeline', 'inbox', 'calendar', 'contacts'].includes(context)) {
      return new Response('Invalid context', { status: 400 });
    }

    const result = await aiService.sendMessage('Summarize', undefined, { type: context as any });

    return new Response(JSON.stringify({ summary: result.content }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI summary API error:', error);
    return new Response('Failed to generate summary', { status: 500 });
  }
}
