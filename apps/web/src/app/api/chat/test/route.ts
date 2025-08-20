import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check OpenAI configuration
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const apiKeyLength = process.env.OPENAI_API_KEY?.length || 0;
    const apiKeyPreview = process.env.OPENAI_API_KEY ? 
      `${process.env.OPENAI_API_KEY.substring(0, 7)}...${process.env.OPENAI_API_KEY.substring(-4)}` : 
      'Not set';

    let openaiTestResult = 'Not tested';
    let openaiError: string | null = null;

    if (hasApiKey) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Test with a simple completion
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: 'Say "Hello, OpenAI connection test successful!"' }
          ],
          max_tokens: 50,
          temperature: 0
        });

        openaiTestResult = completion.choices[0]?.message?.content || 'Empty response';
      } catch (error: any) {
        openaiError = error.message || String(error);
        openaiTestResult = 'Connection failed';
      }
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenaiKey: hasApiKey,
        apiKeyLength,
        apiKeyPreview
      },
      openai: {
        testResult: openaiTestResult,
        error: openaiError
      },
      user: {
        email: session.user.email,
        authenticated: true
      }
    };

    return NextResponse.json(diagnostics);

  } catch (error) {
    console.error('Chat diagnostics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}