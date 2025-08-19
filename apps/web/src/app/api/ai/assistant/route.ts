import { NextRequest } from 'next/server';
import { streamAssistantResponse } from '@/server/ai/assistant';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message, leadId, property } = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response('Message required', { status: 400 });
    }
    const stream = await streamAssistantResponse({ prompt: message, leadId, property });
    return new Response(stream);
  } catch (err) {
    console.error('Assistant API error:', err);
    return new Response('Failed to process message', { status: 500 });
  }
}
