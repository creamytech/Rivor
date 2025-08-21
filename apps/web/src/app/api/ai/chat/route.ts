import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the real estate AI assistant
const SYSTEM_PROMPT = `You are an intelligent AI assistant specializing in real estate. You help real estate professionals with:

1. Market Analysis: Provide insights on market trends, pricing strategies, and investment opportunities
2. Lead Management: Help with lead scoring, follow-up strategies, and conversion optimization
3. Property Management: Assist with property listings, descriptions, and valuation guidance
4. Client Communication: Draft emails, proposals, and other client-facing documents
5. Business Strategy: Offer advice on business development, marketing, and growth strategies

You should be professional, knowledgeable, and helpful. Always provide actionable advice and ask clarifying questions when needed. If you're unsure about specific local market data or legal requirements, recommend consulting with local experts.

Keep responses conversational but informative. Use bullet points and clear structure when presenting complex information.`;

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          message: 'Please add your OpenAI API key to the environment variables to enable AI features.'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Add system prompt to the beginning of messages
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the more cost-effective model
      messages: formattedMessages as any,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({
      message: assistantMessage,
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI errors
    if (error?.error?.type === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'OpenAI quota exceeded',
          message: 'Your OpenAI API quota has been exceeded. Please check your billing settings.'
        },
        { status: 429 }
      );
    }

    if (error?.error?.type === 'invalid_api_key') {
      return NextResponse.json(
        { 
          error: 'Invalid OpenAI API key',
          message: 'The provided OpenAI API key is invalid. Please check your configuration.'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'AI service error',
        message: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.'
      },
      { status: 500 }
    );
  }
}