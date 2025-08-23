import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/auth';
import { aiService } from '@/server/ai/ai-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const analysisPrompt = `Analyze the following message for communication style and tone. 
Return a JSON object with the following structure:
{
  "tone": "professional|casual|friendly|formal|enthusiastic|confident|etc",
  "formality": "very_formal|formal|balanced|casual|very_casual",
  "communicationStyle": "direct|relationship_focused|analytical|persuasive|supportive",
  "personalityTraits": ["trait1", "trait2", "trait3"],
  "businessContext": "residential|commercial|investment|luxury|first_time_buyer|etc",
  "confidence": 0.85
}

Message to analyze: "${message}"

Focus on real estate context and communication patterns. Keep trait names short and professional.`;

    const aiResponse = await aiService.sendMessage(
      analysisPrompt,
      undefined,
      { type: 'inbox' }
    );

    // Try to parse JSON from the AI response
    let analysis;
    try {
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback analysis if JSON parsing fails
      analysis = {
        tone: extractToneKeyword(message),
        formality: message.length > 100 ? 'formal' : 'casual',
        communicationStyle: 'relationship_focused',
        personalityTraits: ['professional', 'client-focused'],
        businessContext: 'general',
        confidence: 0.6
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
      originalMessage: message
    });

  } catch (error) {
    console.error('Tone analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze tone'
    }, { status: 500 });
  }
}

function extractToneKeyword(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('excited') || lowerMessage.includes('love') || lowerMessage.includes('amazing')) {
    return 'enthusiastic';
  }
  if (lowerMessage.includes('professional') || lowerMessage.includes('experience')) {
    return 'professional';
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    return 'supportive';
  }
  if (lowerMessage.includes('direct') || lowerMessage.includes('straightforward')) {
    return 'direct';
  }
  
  return 'friendly';
}