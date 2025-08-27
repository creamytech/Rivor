import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    console.log('🧪 Testing AI functionality...');
    
    // Check environment
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const keyPreview = process.env.OPENAI_API_KEY?.substring(0, 8) + '...';
    
    console.log('Environment check:', { hasApiKey, keyPreview });
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not found',
        hasApiKey: false 
      }, { status: 500 });
    }

    // Test OpenAI connection
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('🤖 Testing OpenAI API connection...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say 'Hello, AI test successful!'" }],
      max_tokens: 10,
    });

    const response = completion.choices[0].message.content;
    console.log('✅ OpenAI test successful:', response);

    return NextResponse.json({ 
      success: true,
      hasApiKey,
      keyPreview,
      response,
      model: "gpt-3.5-turbo"
    });

  } catch (error) {
    console.error('❌ AI test failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}