import { prisma } from '@/lib/db-pool';
import { auth } from '@/server/auth';

interface AssistantParams {
  prompt: string;
  leadId?: string;
  property?: Record<string, any>;
}

/**
 * Forward the prompt to the hosted LLM and stream the response back.
 */
export async function streamAssistantResponse(params: AssistantParams) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }
  const orgId = (session as { orgId?: string }).orgId;
  if (!orgId) {
    throw new Error('No organization');
  }

  const { prompt, leadId, property } = params;

  let context = '';

  if (leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId, orgId },
      include: {
        contact: true,
        stage: true,
      },
    });
    if (lead) {
      context += `Lead:\n`;
      context += `- Title: ${lead.title || 'Untitled'}\n`;
      context += `- Status: ${lead.status}\n`;
      context += `- Priority: ${lead.priority}\n`;
      context += `- Stage: ${lead.stage?.name || 'None'}\n`;
      if (lead.probabilityPercent !== null && lead.probabilityPercent !== undefined) {
        context += `- Probability: ${lead.probabilityPercent}%\n`;
      }
      if (lead.contact) {
        context += `- Contact present\n`;
      }
    }
  }

  if (property) {
    context += 'Property:\n';
    for (const [key, value] of Object.entries(property)) {
      context += `- ${key}: ${value}\n`;
    }
  }

  const systemPrompt = `You are a helpful real estate assistant. Use the provided context to answer questions.\n${context}`;

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.body) {
    throw new Error('No response body');
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]') {
            controller.close();
            return;
          }
          if (trimmed.startsWith('data:')) {
            try {
              const data = JSON.parse(trimmed.replace(/^data: /, ''));
              const content: string | undefined = data.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            } catch {
              // ignore JSON parse errors
            }
          }
        }
      }
      controller.close();
    },
  });

  return stream;
}
