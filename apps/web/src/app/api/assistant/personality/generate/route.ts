import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { type, context, recipient } = await request.json();

    // Get agent personality
    const personality = await prisma.agentPersonality.findUnique({
      where: { orgId }
    });

    if (!personality || !personality.onboardingCompleted) {
      return NextResponse.json({ 
        error: 'Personality training not completed',
        requiresOnboarding: true 
      }, { status: 400 });
    }

    // Generate content based on type and personality
    const generatedContent = await generatePersonalizedContent({
      type,
      context,
      recipient,
      personality
    });

    // Save generated content for learning
    await prisma.aIGeneratedContent.create({
      data: {
        orgId,
        contentType: type,
        generatedContent,
        context: JSON.stringify(context),
        personalityVersion: personality.updatedAt.toISOString(),
        isApproved: false // Will be marked as approved when sent
      }
    });

    return NextResponse.json({
      content: generatedContent,
      personalityApplied: {
        style: personality.communicationStyle,
        tone: personality.tonePreferences,
        signature: personality.signatureStyle
      }
    });

  } catch (error) {
    console.error('Error generating personalized content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generatePersonalizedContent({ type, context, recipient, personality }: any) {
  const style = personality.communicationStyle || 'professional';
  const tonePrefs = personality.tonePreferences || {};
  const vocab = personality.vocabularyPreferences || [];
  const patterns = personality.writingPatterns || {};
  const responses = personality.responseStyle || {};
  const brand = personality.personalBrand || {};

  switch (type) {
    case 'lead_greeting':
      return generateLeadGreeting(context, recipient, style, responses);
    
    case 'follow_up_email':
      return generateFollowUpEmail(context, recipient, style, tonePrefs, vocab, patterns);
    
    case 'appointment_request':
      return generateAppointmentRequest(context, recipient, style, responses);
    
    case 'objection_response':
      return generateObjectionResponse(context, recipient, style, responses);
    
    case 'property_description':
      return generatePropertyDescription(context, style, brand, patterns);
    
    case 'client_update':
      return generateClientUpdate(context, recipient, style, tonePrefs);
    
    default:
      return generateGenericMessage(context, recipient, style, tonePrefs);
  }
}

function generateLeadGreeting(context: any, recipient: any, style: string, responses: any) {
  const baseGreeting = responses?.greetingStyle || '';
  
  if (baseGreeting.length > 10) {
    // Use the agent's actual greeting style
    return baseGreeting
      .replace(/\{name\}/gi, recipient?.name || 'there')
      .replace(/\{property\}/gi, context?.property || 'your property search');
  }

  // Fallback based on style
  const greetings = {
    professional: `Dear ${recipient?.name || 'Prospective Client'},\n\nI hope this message finds you well. I understand you're interested in ${context?.property || 'real estate opportunities'} in the area.`,
    casual: `Hi ${recipient?.name || 'there'}! 👋\n\nSaw your interest in ${context?.property || 'properties'} and wanted to reach out personally.`,
    friendly: `Hello ${recipient?.name || 'friend'}!\n\nI'm so excited to hear about your interest in ${context?.property || 'finding your perfect home'}! I'd love to help make your real estate dreams come true.`
  };

  return greetings[style as keyof typeof greetings] || greetings.professional;
}

function generateFollowUpEmail(context: any, recipient: any, style: string, tonePrefs: any, vocab: string[], patterns: any) {
  const warmth = tonePrefs?.warmth || 1;
  const urgency = context?.urgency || 'medium';
  
  let subject = '';
  let body = '';

  // Generate subject line based on context
  switch (context?.reason) {
    case 'no_response':
      subject = style === 'casual' ? 
        `Quick follow-up on ${context?.property || 'your search'} 🏠` :
        `Following up on your ${context?.property || 'property interest'}`;
      break;
    case 'viewing_reminder':
      subject = `Reminder: Your viewing tomorrow at ${context?.time || '2:00 PM'}`;
      break;
    case 'price_drop':
      subject = urgency === 'high' ? 
        `🚨 Price Drop Alert: ${context?.property}` :
        `Good news about ${context?.property || 'your interested property'}`;
      break;
    default:
      subject = `Checking in about ${context?.property || 'your property search'}`;
  }

  // Generate body based on style and warmth
  if (warmth > 2) {
    body = `Hi ${recipient?.name || 'there'}!\n\nI hope you're having a wonderful day! `;
  } else {
    body = `Hello ${recipient?.name || 'there'},\n\n`;
  }

  // Add main message based on context
  switch (context?.reason) {
    case 'no_response':
      body += `I wanted to circle back on ${context?.property || 'the property you were interested in'}. I know how busy life can get, so no worries if you haven't had a chance to respond yet.\n\n`;
      if (style === 'friendly') {
        body += `I'm still here and excited to help you find your perfect home! `;
      } else {
        body += `I'm still available to answer any questions you might have. `;
      }
      break;
    case 'price_drop':
      body += `Great news! The property you were interested in at ${context?.address || '[Property Address]'} just had a price reduction of ${context?.reduction || '$XX,XXX'}.\n\n`;
      if (urgency === 'high') {
        body += `This is likely to generate significant interest, so I wanted to reach out immediately. `;
      }
      break;
  }

  // Add signature based on patterns
  if (patterns?.usesExclamation && style !== 'professional') {
    body += `\n\nLooking forward to hearing from you!`;
  } else {
    body += `\n\nI look forward to your response.`;
  }

  return { subject, body };
}

function generateAppointmentRequest(context: any, recipient: any, style: string, responses: any) {
  const baseRequest = responses?.appointmentSetting || '';
  
  if (baseRequest.length > 10) {
    return baseRequest
      .replace(/\{name\}/gi, recipient?.name || 'there')
      .replace(/\{property\}/gi, context?.property || 'the property')
      .replace(/\{time\}/gi, context?.suggestedTime || 'a convenient time');
  }

  const requests = {
    professional: `I would like to schedule a viewing of ${context?.property || 'the property'} at your earliest convenience. I have availability ${context?.suggestedTime || 'this week'} and would be happy to accommodate your schedule.`,
    casual: `Would you like to set up a time to see ${context?.property || 'the place'} this week? I'm pretty flexible with timing - whatever works for you!`,
    friendly: `I'm so excited to show you ${context?.property || 'this amazing property'}! When would be the perfect time for you to take a look? I can work around your schedule! 😊`
  };

  return requests[style as keyof typeof requests] || requests.professional;
}

function generateObjectionResponse(context: any, recipient: any, style: string, responses: any) {
  const objection = context?.objection || 'not ready';
  const baseResponse = responses?.objectionHandling || '';
  
  if (baseResponse.length > 10) {
    return baseResponse
      .replace(/\{name\}/gi, recipient?.name || 'there')
      .replace(/\{objection\}/gi, objection);
  }

  // Generate response based on objection type
  const responseMap: { [key: string]: { [key: string]: string } } = {
    'not_ready': {
      professional: `I completely understand that timing is important in real estate decisions. Many of my most satisfied clients initially felt they weren't quite ready. Would it be helpful if I kept you informed about market trends and opportunities over the next few months?`,
      casual: `No pressure at all! The market's always changing, so it doesn't hurt to stay informed. How about I just send you interesting properties that come up? No commitment required.`,
      friendly: `I totally get it - buying a home is a huge decision! How about we stay in touch? I love helping people learn about the market even when they're just exploring options. No pressure whatsoever! 😊`
    },
    'too_expensive': {
      professional: `I understand budget considerations are crucial. There are often creative financing options and upcoming properties that might better align with your investment parameters. Would you like me to keep an eye out for properties in your target range?`,
      casual: `Yeah, I hear you on the pricing. The market's been pretty wild. Want me to let you know if anything more reasonable comes up?`,
      friendly: `I completely understand - we definitely want to find something that feels comfortable for your budget! There are always new options coming on the market. Let's find something perfect for you! 💪`
    }
  };

  const objectionKey = objection.replace(/\s+/g, '_').toLowerCase();
  const responses_obj = responseMap[objectionKey] || responseMap['not_ready'];
  
  return responses_obj[style] || responses_obj['professional'];
}

function generatePropertyDescription(context: any, style: string, brand: any, patterns: any) {
  const property = context?.property || {};
  const features = context?.features || [];
  
  let description = '';
  
  if (style === 'professional') {
    description = `This ${property.type || 'property'} offers ${property.bedrooms || 'X'} bedrooms and ${property.bathrooms || 'X'} bathrooms across ${property.sqft || 'XXX'} square feet.`;
  } else if (style === 'friendly') {
    description = `You're going to LOVE this ${property.type || 'home'}! With ${property.bedrooms || 'X'} cozy bedrooms and ${property.bathrooms || 'X'} bathrooms, it's perfect for ${property.lifestyle || 'comfortable living'}! ✨`;
  } else {
    description = `Check out this ${property.type || 'place'} - ${property.bedrooms || 'X'}bd/${property.bathrooms || 'X'}ba, ${property.sqft || 'XXX'} sq ft.`;
  }

  if (features.length > 0) {
    if (patterns?.averageSentenceLength > 15) {
      description += ` Notable features include ${features.slice(0, 3).join(', ')}, making this property particularly attractive for discerning buyers seeking quality and comfort.`;
    } else {
      description += ` Features: ${features.slice(0, 3).join(', ')}.`;
    }
  }

  return description;
}

function generateClientUpdate(context: any, recipient: any, style: string, tonePrefs: any) {
  const update = context?.update || '';
  const milestone = context?.milestone || '';
  
  let message = `Hi ${recipient?.name || 'there'},\n\n`;
  
  if (tonePrefs?.warmth > 2) {
    message += `I hope you're doing well! `;
  }
  
  message += `I wanted to give you a quick update on ${context?.subject || 'your transaction'}.`;
  
  if (milestone) {
    message += ` Great news - we've reached the ${milestone} milestone! `;
  }
  
  if (update) {
    message += `\n\n${update}`;
  }
  
  message += `\n\nAs always, please don't hesitate to reach out if you have any questions!`;
  
  return message;
}

function generateGenericMessage(context: any, recipient: any, style: string, tonePrefs: any) {
  const purpose = context?.purpose || 'follow-up';
  
  let message = `Hi ${recipient?.name || 'there'},\n\n`;
  
  if (tonePrefs?.warmth > 2) {
    message += `I hope this message finds you well! `;
  }
  
  message += context?.customMessage || `I wanted to reach out regarding ${context?.subject || 'your real estate needs'}.`;
  
  message += `\n\nPlease let me know if you have any questions or if there's anything I can help you with.`;
  
  return message;
}