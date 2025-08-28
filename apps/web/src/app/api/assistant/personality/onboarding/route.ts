import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database using email to ensure we have the ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { message, sessionId, action } = await request.json();

    if (action === 'start') {
      // Start new onboarding session
      const onboardingSession = await prisma.onboardingSession.create({
        data: {
          id: uuidv4(),
          orgId,
          userId: user.id,
          sessionType: 'personality_discovery',
          currentStep: 1,
          conversationHistory: JSON.stringify([{
            role: 'assistant',
            content: 'Hi! I\'m your AI assistant and I\'m excited to learn how you communicate so I can help you more effectively. This will take just 3-4 minutes. Let\'s start with a simple question: How do you typically greet new leads when you first reach out to them? Go ahead and write it exactly how you\'d send it.',
            timestamp: new Date().toISOString()
          }])
        }
      });

      return NextResponse.json({
        sessionId: onboardingSession.id,
        message: 'Hi! I\'m your AI assistant and I\'m excited to learn how you communicate so I can help you more effectively. This will take just 3-4 minutes. Let\'s start with a simple question: How do you typically greet new leads when you first reach out to them? Go ahead and write it exactly how you\'d send it.',
        step: 'greeting',
        progress: 10
      });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get existing session
    const session_data = await prisma.onboardingSession.findUnique({
      where: { id: sessionId }
    });

    if (!session_data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let conversationHistory = JSON.parse(session_data.conversationHistory);
    
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Process current step and determine next response
    let nextStep = session_data.currentStep;
    let aiResponse = '';
    let progress = 10;
    let completed = false;

    switch (session_data.currentStep) {
      case 1: // greeting
        nextStep = 2;
        progress = 25;
        // Analyze the user's greeting style
        const isVeryFormal = message.includes('Dear') || message.includes('Good morning') || message.includes('sincerely');
        const isCasual = message.toLowerCase().includes('hey') || message.toLowerCase().includes('hi ') || !message.includes('.');
        const isPersonal = message.includes('I know') || message.includes('I heard') || message.includes('like');
        
        let styleComment = '';
        if (isVeryFormal) {
          styleComment = 'I can see you prefer a professional, formal tone in your communications. ';
        } else if (isCasual && isPersonal) {
          styleComment = 'I notice you have a casual, personal approach - that\'s great for building relationships! ';
        } else if (isCasual) {
          styleComment = 'You have a friendly, approachable communication style. ';
        } else {
          styleComment = 'I can see your professional yet warm communication approach. ';
        }
        
        aiResponse = `${styleComment}Now, when a lead doesn't respond to your initial message, how do you typically follow up? Show me how you'd write a follow-up email after 3 days of no response.`;
        break;

      case 2: // follow_up_style
        nextStep = 3;
        progress = 40;
        const isPersistent = message.toLowerCase().includes('just wanted') || message.toLowerCase().includes('checking in') || message.toLowerCase().includes('following up');
        const isValueBased = message.toLowerCase().includes('market') || message.toLowerCase().includes('opportunity') || message.toLowerCase().includes('help');
        
        let followUpComment = '';
        if (isPersistent && isValueBased) {
          followUpComment = 'Excellent! You balance persistence with value - that\'s a winning approach. ';
        } else if (isPersistent) {
          followUpComment = 'I can see you\'re good at staying top-of-mind with your leads. ';
        } else if (isValueBased) {
          followUpComment = 'Great approach focusing on providing value rather than just checking in. ';
        } else {
          followUpComment = 'I\'m learning your follow-up style. ';
        }
        
        aiResponse = `${followUpComment}Now let's see how you handle pushback. If a lead says "I'm not ready to buy right now, maybe in 6 months," how would you respond to keep them engaged?`;
        break;

      case 3: // objection_handling
        nextStep = 4;
        progress = 55;
        const isEmpathetic = message.toLowerCase().includes('understand') || message.toLowerCase().includes('get it') || message.toLowerCase().includes('totally');
        const isNurturing = message.toLowerCase().includes('keep you updated') || message.toLowerCase().includes('touch base') || message.toLowerCase().includes('when you\'re ready');
        const isUrgent = message.toLowerCase().includes('rates') || message.toLowerCase().includes('market') || message.toLowerCase().includes('now is');
        
        let objectionComment = '';
        if (isEmpathetic && isNurturing) {
          objectionComment = 'Perfect! You show empathy while staying engaged - that builds trust. ';
        } else if (isUrgent) {
          objectionComment = 'I see you like to create helpful urgency with market insights. ';
        } else if (isNurturing) {
          objectionComment = 'Great nurturing approach - staying connected without pressure. ';
        } else {
          objectionComment = 'Interesting approach to handling objections. ';
        }
        
        aiResponse = `${objectionComment}One more scenario: You've been talking with a qualified lead and you want to set up a showing. How do you typically ask them to schedule an appointment?`;
        break;

      case 4: // appointment_setting
        nextStep = 5;
        progress = 70;
        const isDirectAsk = message.toLowerCase().includes('when can') || message.toLowerCase().includes('available') || message.toLowerCase().includes('schedule');
        const isFlexible = message.toLowerCase().includes('work for you') || message.toLowerCase().includes('convenient') || message.toLowerCase().includes('flexible');
        const isPressure = message.toLowerCase().includes('this weekend') || message.toLowerCase().includes('soon') || message.toLowerCase().includes('quickly');
        
        let appointmentComment = '';
        if (isDirectAsk && isFlexible) {
          appointmentComment = 'Excellent! You\'re direct but accommodating - clients appreciate that balance. ';
        } else if (isPressure) {
          appointmentComment = 'I see you like to create momentum and urgency in your scheduling. ';
        } else if (isFlexible) {
          appointmentComment = 'Great client-focused approach to scheduling! ';
        } else {
          appointmentComment = 'I\'m noting your appointment-setting style. ';
        }
        
        aiResponse = `${appointmentComment}Now tell me about your personal brand. What makes you unique as a real estate agent? What would you want every client to know about working with you? Write it like you're telling a friend.`;
        break;

      case 5: // personal_brand
        nextStep = 6;
        progress = 85;
        const isExperienceFocused = message.toLowerCase().includes('years') || message.toLowerCase().includes('experience') || message.toLowerCase().includes('helped');
        const isRelationshipFocused = message.toLowerCase().includes('trust') || message.toLowerCase().includes('relationship') || message.toLowerCase().includes('care');
        const isResultsFocused = message.toLowerCase().includes('results') || message.toLowerCase().includes('sold') || message.toLowerCase().includes('success');
        
        let brandComment = '';
        if (isRelationshipFocused) {
          brandComment = 'I love that you prioritize relationships and trust - that\'s what makes clients loyal! ';
        } else if (isResultsFocused) {
          brandComment = 'Great focus on results and success - clients need to see your track record! ';
        } else if (isExperienceFocused) {
          brandComment = 'Your experience really shows, and that builds client confidence. ';
        } else {
          brandComment = 'I\'m getting a good sense of your unique value proposition. ';
        }
        
        aiResponse = `${brandComment}One final question: Do you have any specific words, phrases, or expressions that you use regularly? Any signature sign-offs or ways you like to end your messages?`;
        break;

      case 6: // completion
        completed = true;
        progress = 100;
        aiResponse = 'Fantastic! I\'ve learned a lot about your communication style. I\'m now analyzing your responses to understand your tone, vocabulary preferences, and unique voice. This will help me write emails, follow-ups, and messages that sound authentically like you. Give me just a moment to process everything...';
        
        // Analyze the conversation and extract personality traits
        await analyzeAndSavePersonality(orgId, user.id, conversationHistory);
        
        // Mark session as completed
        await prisma.onboardingSession.update({
          where: { id: sessionId },
          data: { 
            status: 'completed',
            completedAt: new Date(),
            currentStep: nextStep
          }
        });
        break;

      default:
        aiResponse = 'I\'m not sure what to ask next. Let me help you get started again.';
    }

    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    // Update session
    await prisma.onboardingSession.update({
      where: { id: sessionId },
      data: {
        currentStep: nextStep,
        conversationHistory: JSON.stringify(conversationHistory)
      }
    });

    return NextResponse.json({
      message: aiResponse,
      step: nextStep,
      progress,
      completed
    });

  } catch (error) {
    console.error('Error in onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function analyzeAndSavePersonality(orgId: string, userId: string, conversationHistory: any[]) {
  try {
    // Extract user messages (skip assistant messages)
    const userMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content);

    // Analyze communication patterns
    const analysis = analyzeCommunicationStyle(userMessages);

    // Check if personality record exists
    const existingPersonality = await prisma.agentPersonality.findUnique({
      where: { orgId }
    });

    const personalityData = {
      orgId,
      userId,
      onboardingCompleted: true,
      communicationStyle: analysis.style,
      tonePreferences: analysis.tone,
      vocabularyPreferences: analysis.vocabulary,
      writingPatterns: analysis.patterns,
      responseStyle: analysis.responses,
      personalBrand: analysis.brand,
      signatureStyle: analysis.signature
    };

    if (existingPersonality) {
      await prisma.agentPersonality.update({
        where: { orgId },
        data: personalityData
      });
    } else {
      await prisma.agentPersonality.create({
        data: personalityData
      });
    }

    // Create training record
    await prisma.aIPersonalityTraining.create({
      data: {
        id: uuidv4(),
        orgId,
        trainingType: 'onboarding',
        inputData: JSON.stringify(conversationHistory),
        extractedPatterns: JSON.stringify(analysis),
        confidence: calculateConfidence(analysis),
        validatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error analyzing personality:', error);
  }
}

function analyzeCommunicationStyle(messages: string[]) {
  const allText = messages.join(' ').toLowerCase();
  
  // Analyze tone
  const warmWords = ['thanks', 'appreciate', 'wonderful', 'great', 'excited', 'love', 'happy'];
  const professionalWords = ['regarding', 'however', 'furthermore', 'consequently', 'therefore'];
  const casualWords = ['hey', 'awesome', 'cool', 'yeah', 'sure thing', 'no problem'];
  
  const warmScore = warmWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
  const professionalScore = professionalWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
  const casualScore = casualWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);

  // Determine dominant style
  let style = 'balanced';
  if (professionalScore > casualScore && professionalScore > warmScore) {
    style = 'professional';
  } else if (casualScore > professionalScore && casualScore > warmScore) {
    style = 'casual';
  } else if (warmScore > professionalScore && warmScore > casualScore) {
    style = 'friendly';
  }

  // Extract common phrases and vocabulary
  const vocabulary = extractCommonPhrases(messages);
  
  // Analyze writing patterns
  const avgSentenceLength = messages.join(' ').split('.').reduce((sum, sentence) => {
    return sum + sentence.trim().split(' ').length;
  }, 0) / messages.filter(msg => msg.includes('.')).length || 1;

  const patterns = {
    averageSentenceLength: Math.round(avgSentenceLength),
    usesExclamation: allText.includes('!'),
    usesQuestions: allText.includes('?'),
    paragraphStyle: avgSentenceLength > 15 ? 'detailed' : 'concise',
    emojiUsage: /[\u{1F600}-\u{1F64F}]/u.test(allText) ? 'frequent' : 'minimal'
  };

  return {
    style,
    tone: {
      warmth: warmScore,
      professionalism: professionalScore,
      casualness: casualScore
    },
    vocabulary: vocabulary,
    patterns: patterns,
    responses: extractResponsePatterns(messages),
    brand: extractPersonalBrand(messages),
    signature: extractSignatureStyle(messages)
  };
}

function extractCommonPhrases(messages: string[]) {
  const phrases = [];
  messages.forEach(message => {
    const words = message.toLowerCase().split(' ');
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words.slice(i, i + 2).join(' ');
      if (phrase.length > 3) {
        phrases.push(phrase);
      }
    }
  });
  return [...new Set(phrases)].slice(0, 20);
}

function extractResponsePatterns(messages: string[]) {
  return {
    greetingStyle: messages[0] || '',
    followUpApproach: messages[1] || '',
    objectionHandling: messages[2] || '',
    appointmentSetting: messages[3] || ''
  };
}

function extractPersonalBrand(messages: string[]) {
  const brandMessage = messages[4] || '';
  return {
    uniqueValueProposition: brandMessage,
    specialties: [],
    personalityTraits: []
  };
}

function extractSignatureStyle(messages: string[]) {
  const lastMessage = messages[messages.length - 1] || '';
  const signaturePhrases = lastMessage.split('\n').slice(-2);
  return signaturePhrases.join('\n');
}

function calculateConfidence(analysis: any) {
  let confidence = 0;
  
  if (analysis.vocabulary.length > 10) confidence += 20;
  if (analysis.responses.greetingStyle.length > 10) confidence += 20;
  if (analysis.responses.followUpApproach.length > 10) confidence += 20;
  if (analysis.responses.objectionHandling.length > 10) confidence += 20;
  if (analysis.brand.uniqueValueProposition.length > 20) confidence += 20;
  
  return Math.min(confidence, 100);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Check if agent has completed onboarding
    try {
      const personality = await prisma.agentPersonality.findUnique({
        where: { orgId }
      });

      return NextResponse.json({
        hasCompletedOnboarding: personality?.onboardingCompleted || false,
        personality: personality || null
      });
    } catch (dbError: any) {
      // Handle case where personality tables don't exist yet (migration not run)
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        console.warn('AgentPersonality table not found, personality features not available');
        return NextResponse.json({
          hasCompletedOnboarding: false,
          personality: null,
          migrationRequired: true
        });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      hasCompletedOnboarding: false,
      personality: null 
    }, { status: 500 });
  }
}