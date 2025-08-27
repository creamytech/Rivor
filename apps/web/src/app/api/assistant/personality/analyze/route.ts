import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailContent, source, context } = await request.json();

    if (!emailContent) {
      return NextResponse.json({ error: 'Email content is required' }, { status: 400 });
    }

    // Analyze the communication
    const analysis = await analyzeRealCommunication(emailContent);
    
    // Get existing personality
    const existingPersonality = await prisma.agentPersonality.findUnique({
      where: { orgId: session.user.orgId }
    });

    if (!existingPersonality) {
      return NextResponse.json({ 
        error: 'Personality profile not found. Complete onboarding first.' 
      }, { status: 404 });
    }

    // Create training record
    await prisma.aIPersonalityTraining.create({
      data: {
        id: uuidv4(),
        orgId: session.user.orgId,
        trainingType: 'real_communication',
        inputData: JSON.stringify({ emailContent, source, context }),
        extractedPatterns: JSON.stringify(analysis),
        confidence: calculateAnalysisConfidence(analysis),
        validatedAt: new Date()
      }
    });

    // Update personality with new insights
    await updatePersonalityWithAnalysis(session.user.orgId, existingPersonality, analysis);

    return NextResponse.json({
      success: true,
      analysis: analysis,
      updatedPatterns: true
    });

  } catch (error) {
    console.error('Error analyzing communication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '30d';

    // Get recent training data for analysis
    const recentTraining = await prisma.aIPersonalityTraining.findMany({
      where: {
        orgId: session.user.orgId,
        createdAt: {
          gte: getDateFromTimeframe(timeframe)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Get current personality
    const personality = await prisma.agentPersonality.findUnique({
      where: { orgId: session.user.orgId }
    });

    // Analyze trends and improvements
    const analysis = analyzeLearningTrends(recentTraining);

    return NextResponse.json({
      personality: personality,
      trainingHistory: recentTraining,
      trends: analysis,
      totalTrainingSessions: recentTraining.length
    });

  } catch (error) {
    console.error('Error getting personality analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function analyzeRealCommunication(emailContent: string) {
  const text = emailContent.toLowerCase();
  
  // Analyze tone indicators
  const toneAnalysis = {
    warmth: calculateWarmthScore(text),
    professionalism: calculateProfessionalismScore(text),
    urgency: calculateUrgencyScore(text),
    enthusiasm: calculateEnthusiasmScore(text)
  };

  // Analyze structure and patterns
  const structureAnalysis = {
    avgSentenceLength: calculateAvgSentenceLength(emailContent),
    paragraphCount: emailContent.split('\n\n').length,
    usesPersonalization: /\b(you|your|we|us|together)\b/i.test(text),
    usesQuestions: emailContent.includes('?'),
    usesExclamation: emailContent.includes('!'),
    usesEmoji: /[😀-🙏]/.test(emailContent)
  };

  // Extract vocabulary patterns
  const vocabularyAnalysis = {
    commonPhrases: extractPhrases(emailContent),
    industryTerms: extractIndustryTerms(text),
    formalityLevel: calculateFormalityLevel(text)
  };

  // Analyze communication approach
  const approachAnalysis = {
    directness: calculateDirectnessScore(text),
    supportiveness: calculateSupportivenessScore(text),
    consultativeStyle: calculateConsultativeScore(text)
  };

  return {
    tone: toneAnalysis,
    structure: structureAnalysis,
    vocabulary: vocabularyAnalysis,
    approach: approachAnalysis,
    extractedAt: new Date().toISOString()
  };
}

function calculateWarmthScore(text: string): number {
  const warmWords = [
    'excited', 'wonderful', 'amazing', 'fantastic', 'great', 'excellent',
    'happy', 'pleased', 'thrilled', 'delighted', 'love', 'enjoy',
    'appreciate', 'thank', 'grateful', 'welcome', 'perfect', 'awesome'
  ];
  
  const score = warmWords.reduce((acc, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    return acc + (matches ? matches.length : 0);
  }, 0);

  // Normalize by text length (per 100 words)
  const wordCount = text.split(' ').length;
  return Math.min((score / wordCount) * 100, 10);
}

function calculateProfessionalismScore(text: string): number {
  const professionalWords = [
    'regarding', 'furthermore', 'however', 'consequently', 'therefore',
    'professional', 'expertise', 'experience', 'service', 'commitment',
    'dedicated', 'comprehensive', 'thorough', 'strategic'
  ];

  const casualWords = [
    'hey', 'yeah', 'sure thing', 'no problem', 'cool', 'awesome',
    'totally', 'kinda', 'gonna', 'wanna', 'super'
  ];

  const professionalScore = professionalWords.reduce((acc, word) => {
    return acc + (text.includes(word) ? 1 : 0);
  }, 0);

  const casualScore = casualWords.reduce((acc, word) => {
    return acc + (text.includes(word) ? 1 : 0);
  }, 0);

  return Math.max(0, Math.min(10, (professionalScore - casualScore) + 5));
}

function calculateUrgencyScore(text: string): number {
  const urgencyWords = [
    'urgent', 'immediately', 'asap', 'quickly', 'soon', 'deadline',
    'time-sensitive', 'important', 'priority', 'critical', 'fast'
  ];

  const score = urgencyWords.reduce((acc, word) => {
    return acc + (text.includes(word) ? 1 : 0);
  }, 0);

  // Check for punctuation patterns
  const exclamationCount = (text.match(/!/g) || []).length;
  const allCapsCount = (text.match(/\b[A-Z]{3,}\b/g) || []).length;

  return Math.min(10, score + exclamationCount * 0.5 + allCapsCount);
}

function calculateEnthusiasmScore(text: string): number {
  const enthusiasmWords = [
    'excited', 'thrilled', 'amazing', 'fantastic', 'incredible',
    'outstanding', 'wonderful', 'brilliant', 'spectacular', 'phenomenal'
  ];

  const score = enthusiasmWords.reduce((acc, word) => {
    return acc + (text.includes(word) ? 1 : 0);
  }, 0);

  const exclamationCount = (text.match(/!/g) || []).length;
  const emojiCount = (text.match(/[😀-🙏]/g) || []).length;

  return Math.min(10, score + exclamationCount * 0.3 + emojiCount * 0.5);
}

function calculateAvgSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  const totalWords = sentences.reduce((acc, sentence) => {
    return acc + sentence.trim().split(' ').length;
  }, 0);
  
  return Math.round(totalWords / sentences.length);
}

function extractPhrases(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const phrases: string[] = [];
  
  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const twoWordPhrase = words.slice(i, i + 2).join(' ');
    if (twoWordPhrase.length > 5) {
      phrases.push(twoWordPhrase);
    }
    
    if (i < words.length - 2) {
      const threeWordPhrase = words.slice(i, i + 3).join(' ');
      if (threeWordPhrase.length > 8) {
        phrases.push(threeWordPhrase);
      }
    }
  }
  
  // Return most common phrases
  const phraseCount = phrases.reduce((acc: { [key: string]: number }, phrase) => {
    acc[phrase] = (acc[phrase] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(phraseCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([phrase]) => phrase);
}

function extractIndustryTerms(text: string): string[] {
  const realEstateTerms = [
    'property', 'listing', 'market', 'mortgage', 'closing', 'escrow',
    'inspection', 'appraisal', 'equity', 'commission', 'mls', 'buyer',
    'seller', 'agent', 'broker', 'realtor', 'investment', 'rental',
    'residential', 'commercial', 'square feet', 'bedroom', 'bathroom'
  ];
  
  return realEstateTerms.filter(term => text.includes(term));
}

function calculateFormalityLevel(text: string): number {
  const formalMarkers = [
    'sincerely', 'respectfully', 'cordially', 'regarding', 'pursuant',
    'therefore', 'furthermore', 'however', 'nevertheless'
  ];
  
  const informalMarkers = [
    'hey', 'hi there', 'thanks so much', 'no worries', 'sounds good',
    'let me know', 'talk soon', 'catch up', 'touch base'
  ];
  
  const formalScore = formalMarkers.reduce((acc, marker) => {
    return acc + (text.includes(marker) ? 1 : 0);
  }, 0);
  
  const informalScore = informalMarkers.reduce((acc, marker) => {
    return acc + (text.includes(marker) ? 1 : 0);
  }, 0);
  
  return Math.max(0, Math.min(10, (formalScore - informalScore) + 5));
}

function calculateDirectnessScore(text: string): number {
  const directIndicators = [
    'i recommend', 'you should', 'i suggest', 'my advice', 'here\'s what',
    'the best option', 'i think you', 'let\'s do', 'we need to'
  ];
  
  const indirectIndicators = [
    'you might consider', 'perhaps', 'maybe', 'possibly', 'if you\'d like',
    'you could', 'it might be', 'one option is', 'you may want'
  ];
  
  const directScore = directIndicators.reduce((acc, indicator) => {
    return acc + (text.includes(indicator) ? 1 : 0);
  }, 0);
  
  const indirectScore = indirectIndicators.reduce((acc, indicator) => {
    return acc + (text.includes(indicator) ? 1 : 0);
  }, 0);
  
  return Math.max(0, Math.min(10, (directScore - indirectScore) + 5));
}

function calculateSupportivenessScore(text: string): number {
  const supportiveWords = [
    'help', 'support', 'assist', 'guide', 'here for you', 'available',
    'happy to', 'glad to', 'pleased to', 'understand', 'listen'
  ];
  
  const score = supportiveWords.reduce((acc, word) => {
    return acc + (text.includes(word) ? 1 : 0);
  }, 0);
  
  return Math.min(10, score);
}

function calculateConsultativeScore(text: string): number {
  const consultativeWords = [
    'what do you think', 'your thoughts', 'your opinion', 'how do you feel',
    'what works for you', 'your preference', 'together we', 'collaborate',
    'partnership', 'work with you'
  ];
  
  const score = consultativeWords.reduce((acc, phrase) => {
    return acc + (text.includes(phrase) ? 1 : 0);
  }, 0);
  
  const questionCount = (text.match(/\?/g) || []).length;
  
  return Math.min(10, score + questionCount * 0.5);
}

function calculateAnalysisConfidence(analysis: any): number {
  let confidence = 0;
  
  // Base confidence on amount of analyzable content
  if (analysis.structure.avgSentenceLength > 0) confidence += 20;
  if (analysis.vocabulary.commonPhrases.length > 5) confidence += 20;
  if (analysis.vocabulary.industryTerms.length > 3) confidence += 20;
  if (analysis.tone.warmth > 0) confidence += 20;
  if (analysis.approach.directness > 0) confidence += 20;
  
  return confidence;
}

async function updatePersonalityWithAnalysis(orgId: string, existingPersonality: any, analysis: any) {
  // Merge new analysis with existing personality
  const currentTone = existingPersonality.tonePreferences || {};
  const currentPatterns = existingPersonality.writingPatterns || {};
  
  const updatedTonePreferences = {
    warmth: Math.round((currentTone.warmth || 0 + analysis.tone.warmth) / 2),
    professionalism: Math.round((currentTone.professionalism || 0 + analysis.tone.professionalism) / 2),
    urgency: Math.round((currentTone.urgency || 0 + analysis.tone.urgency) / 2),
    enthusiasm: Math.round((currentTone.enthusiasm || 0 + analysis.tone.enthusiasm) / 2)
  };
  
  const updatedWritingPatterns = {
    ...currentPatterns,
    averageSentenceLength: analysis.structure.avgSentenceLength,
    usesPersonalization: analysis.structure.usesPersonalization,
    usesQuestions: analysis.structure.usesQuestions,
    usesExclamation: analysis.structure.usesExclamation,
    usesEmoji: analysis.structure.usesEmoji,
    directnessLevel: analysis.approach.directness,
    supportivenessLevel: analysis.approach.supportiveness
  };
  
  await prisma.agentPersonality.update({
    where: { orgId },
    data: {
      tonePreferences: updatedTonePreferences,
      writingPatterns: updatedWritingPatterns,
      vocabularyPreferences: analysis.vocabulary.commonPhrases
    }
  });
}

function analyzeLearningTrends(trainingData: any[]) {
  if (trainingData.length === 0) {
    return { trend: 'no_data', confidence: 0, improvements: [] };
  }
  
  // Analyze confidence trends over time
  const confidenceScores = trainingData.map(t => t.confidence);
  const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
  
  // Analyze training frequency
  const daysActive = new Set(trainingData.map(t => t.createdAt.toDateString())).size;
  
  return {
    trend: avgConfidence > 70 ? 'improving' : 'stable',
    confidence: Math.round(avgConfidence),
    improvements: [
      'Communication style consistency',
      'Tone matching accuracy',
      'Vocabulary pattern recognition'
    ],
    trainingFrequency: daysActive,
    totalSessions: trainingData.length
  };
}

function getDateFromTimeframe(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}