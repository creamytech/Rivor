import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { AIService, EmailDraftOptions } from '@/server/ai';

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

    const body = await req.json();
    const { type, tone, context } = body;

    // Validate required fields
    if (!type || !tone) {
      return new Response('Missing required fields: type and tone', { status: 400 });
    }

    if (!['reply', 'follow-up', 'introduction', 'meeting-request'].includes(type)) {
      return new Response('Invalid type. Must be: reply, follow-up, introduction, or meeting-request', { status: 400 });
    }

    if (!['professional', 'warm', 'casual', 'urgent'].includes(tone)) {
      return new Response('Invalid tone. Must be: professional, warm, casual, or urgent', { status: 400 });
    }

    const options: EmailDraftOptions = {
      type,
      tone,
      context: context || {}
    };

    // Generate email draft
    const draft = await AIService.generateEmailDraft(options, orgId);

    return new Response(JSON.stringify({
      ...draft,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Email draft API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate email draft',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
