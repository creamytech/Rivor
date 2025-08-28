import { prisma } from '@/lib/db-pool';

export interface PersonalityData {
  communicationStyle: string;
  tonePreferences: any;
  vocabularyPreferences: any;
  writingPatterns: any;
  responseStyle: any;
  personalBrand: any;
  signatureStyle: string;
}

/**
 * Get personality data for an organization
 */
export async function getPersonalityForOrg(orgId: string): Promise<PersonalityData | null> {
  try {
    const personality = await prisma.agentPersonality.findUnique({
      where: { orgId },
      select: {
        communicationStyle: true,
        tonePreferences: true,
        vocabularyPreferences: true,
        writingPatterns: true,
        responseStyle: true,
        personalBrand: true,
        signatureStyle: true,
        onboardingCompleted: true
      }
    });

    if (!personality || !personality.onboardingCompleted) {
      return null;
    }

    return personality;
  } catch (error) {
    console.error('Error fetching personality data:', error);
    return null;
  }
}

/**
 * Generate personality-aware system prompt
 */
export function generatePersonalityPrompt(personality: PersonalityData): string {
  const style = personality.communicationStyle || 'professional';
  const tone = personality.tonePreferences || {};
  const brand = personality.personalBrand || {};
  const responseStyle = personality.responseStyle || {};
  const patterns = personality.writingPatterns || {};

  let prompt = `You are a real estate agent assistant that mimics this agent's unique communication style and personality:

COMMUNICATION STYLE: ${style}
- Writing tone: ${tone.warmth > tone.professionalism ? 'warm and friendly' : tone.professionalism > tone.casualness ? 'professional and polished' : 'balanced and approachable'}
- Sentence style: ${patterns.paragraphStyle === 'detailed' ? 'detailed explanations' : 'concise and to-the-point'}
- Uses exclamation points: ${patterns.usesExclamation ? 'frequently' : 'sparingly'}
- Asks questions: ${patterns.usesQuestions ? 'often engages with questions' : 'makes direct statements'}

GREETING STYLE: "${responseStyle.greetingStyle || 'Hello'}"

FOLLOW-UP APPROACH: "${responseStyle.followUpApproach || 'Professional follow-up'}"

OBJECTION HANDLING: "${responseStyle.objectionHandling || 'Understanding and addressing concerns'}"

PERSONAL BRAND: "${brand.uniqueValueProposition || 'Professional real estate service'}"

SIGNATURE STYLE: "${personality.signatureStyle || 'Best regards'}"

IMPORTANT: Write exactly as this agent would write. Match their:
- Vocabulary and phrases they commonly use
- Greeting and closing style
- Level of formality
- Way of handling objections
- Personal brand messaging
- Sentence length and structure

Always sound like the agent wrote it personally, not like an AI assistant.`;

  return prompt;
}

/**
 * Generate fallback prompt when no personality data is available
 */
export function generateFallbackPrompt(): string {
  return `You are a professional real estate agent assistant. Write in a friendly but professional tone, providing helpful and specific real estate advice and responses.`;
}