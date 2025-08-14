import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { AIService, ChatMessage } from '@/server/ai';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const orgId = (session as any).orgId as string | undefined;
    if (!orgId) {
      return new Response('Forbidden', { status: 403 });
    }

    const { messages, useContext = true } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Validate message format
    const validMessages: ChatMessage[] = messages.filter(msg => 
      msg && 
      typeof msg.content === 'string' && 
      ['user', 'assistant', 'system'].includes(msg.role)
    );

    if (validMessages.length === 0) {
      return new Response('No valid messages provided', { status: 400 });
    }

    // Generate AI response
    const response = await AIService.generateChatResponse(
      validMessages,
      orgId,
      { useContext }
    );

    return new Response(JSON.stringify({ 
      response,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate response',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
