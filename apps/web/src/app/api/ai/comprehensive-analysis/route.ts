import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/auth';
import { aiService } from '@/server/ai/ai-service';
import { prisma } from '@/lib/db-pool';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, conversationContext } = await request.json();

    if (!messages || typeof messages !== 'string') {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const comprehensivePrompt = `Based on the following conversation with a real estate professional during onboarding, provide a comprehensive communication style analysis.

Conversation: "${messages}"

Please analyze and return a JSON object with this exact structure:
{
  "overallTone": "professional and approachable|formal and authoritative|casual and friendly|enthusiastic and energetic|etc",
  "communicationStyle": "relationship-focused|results-oriented|analytical|consultative|direct|collaborative",
  "preferredFormality": "formal|balanced|casual",
  "keyPersonalityTraits": ["approachable", "knowledgeable", "client-focused", "detail-oriented", "etc"],
  "businessFocus": ["residential", "commercial", "luxury", "investment", "first-time-buyers", "etc"],
  "confidence": 0.85,
  "writingStyle": {
    "sentenceLength": "short|medium|long",
    "vocabularyLevel": "simple|professional|sophisticated",
    "emotionalExpression": "reserved|balanced|expressive"
  },
  "clientInteractionPreferences": {
    "followUpStyle": "immediate|scheduled|relationship-building",
    "communicationFrequency": "high|moderate|low",
    "preferredChannels": ["email", "phone", "text", "in-person"]
  }
}

Focus on real estate industry context. Be specific and actionable in your analysis.`;

    const aiResponse = await aiService.sendMessage(
      comprehensivePrompt,
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
      console.warn('Failed to parse AI analysis, using fallback:', parseError);
      
      // Fallback comprehensive analysis
      analysis = {
        overallTone: 'professional and approachable',
        communicationStyle: determineStyleFromText(messages),
        preferredFormality: messages.length > 300 ? 'formal' : 'balanced',
        keyPersonalityTraits: extractPersonalityTraits(messages),
        businessFocus: extractBusinessFocus(messages),
        confidence: 0.75,
        writingStyle: {
          sentenceLength: getAverageSentenceLength(messages),
          vocabularyLevel: 'professional',
          emotionalExpression: 'balanced'
        },
        clientInteractionPreferences: {
          followUpStyle: 'relationship-building',
          communicationFrequency: 'moderate',
          preferredChannels: ['email', 'phone']
        }
      };
    }

    // Store the analysis for the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { orgMembers: { include: { org: true } } }
    });

    if (user && analysis) {
      // In a real implementation, you might store this in a user_preferences or profile_analysis table
      console.log('Storing user communication analysis:', {
        userId: user.id,
        analysis: analysis
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        messageLength: messages.length,
        analysisTimestamp: new Date().toISOString(),
        conversationContext
      }
    });

  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to perform comprehensive analysis'
    }, { status: 500 });
  }
}

function determineStyleFromText(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('relationship') || lowerText.includes('client') || lowerText.includes('people')) {
    return 'relationship-focused';
  }
  if (lowerText.includes('results') || lowerText.includes('goals') || lowerText.includes('achieve')) {
    return 'results-oriented';
  }
  if (lowerText.includes('analyze') || lowerText.includes('data') || lowerText.includes('research')) {
    return 'analytical';
  }
  if (lowerText.includes('direct') || lowerText.includes('straightforward')) {
    return 'direct';
  }
  
  return 'consultative';
}

function extractPersonalityTraits(text: string): string[] {
  const traits = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('help') || lowerText.includes('support')) {
    traits.push('supportive');
  }
  if (lowerText.includes('experience') || lowerText.includes('knowledge')) {
    traits.push('knowledgeable');
  }
  if (lowerText.includes('client') || lowerText.includes('customer')) {
    traits.push('client-focused');
  }
  if (lowerText.includes('detail') || lowerText.includes('thorough')) {
    traits.push('detail-oriented');
  }
  if (lowerText.includes('friendly') || lowerText.includes('approachable')) {
    traits.push('approachable');
  }
  if (lowerText.includes('professional') || lowerText.includes('business')) {
    traits.push('professional');
  }
  
  // Default traits if none detected
  if (traits.length === 0) {
    traits.push('professional', 'client-focused');
  }
  
  return traits.slice(0, 4); // Limit to 4 traits
}

function extractBusinessFocus(text: string): string[] {
  const focus = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('residential') || lowerText.includes('home') || lowerText.includes('house')) {
    focus.push('residential');
  }
  if (lowerText.includes('commercial') || lowerText.includes('business') || lowerText.includes('office')) {
    focus.push('commercial');
  }
  if (lowerText.includes('investment') || lowerText.includes('investor')) {
    focus.push('investment');
  }
  if (lowerText.includes('luxury') || lowerText.includes('high-end')) {
    focus.push('luxury');
  }
  if (lowerText.includes('first-time') || lowerText.includes('new buyer')) {
    focus.push('first-time-buyers');
  }
  
  // Default to residential if no specific focus detected
  if (focus.length === 0) {
    focus.push('residential');
  }
  
  return focus;
}

function getAverageSentenceLength(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 'medium';
  
  const averageLength = sentences.reduce((sum, sentence) => sum + sentence.trim().split(/\s+/).length, 0) / sentences.length;
  
  if (averageLength < 8) return 'short';
  if (averageLength > 15) return 'long';
  return 'medium';
}