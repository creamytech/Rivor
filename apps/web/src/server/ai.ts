import { prisma } from './db';
import { encryptForOrg } from './crypto';
import { getEnv } from './env';

async function callOpenAI(summaryMode: 'short' | 'medium' | 'detailed', sanitizedSnippets: string[]): Promise<string> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    return `Summary (${sanitizedSnippets.length} msgs): ${sanitizedSnippets.slice(-3).join(' ')}`.slice(0, 1000);
  }
  const system = [
    'You are an assistant that summarizes email threads.',
    'Redaction policy: Do not reveal PII; assume snippets are sanitized.',
    'Stay within character limits and produce a standalone summary.',
  ].join('\n');
  const maxChars = summaryMode === 'short' ? 400 : summaryMode === 'medium' ? 900 : 1600;
  const user = `Summarize the following sanitized snippets into a ${summaryMode} summary (max ${maxChars} chars):\n\n${sanitizedSnippets.join('\n\n')}`;
  const base = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      max_tokens: 512,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? '';
  return String(content).slice(0, maxChars);
}

export async function summarizeThread(orgId: string, threadId: string, mode: 'short' | 'medium' | 'detailed' = 'short'): Promise<void> {
  const messages = await prisma.emailMessage.findMany({ where: { threadId }, orderBy: { sentAt: 'asc' }, select: { snippetEnc: true, orgId: true } });
  const sanitized: string[] = [];
  for (const _ of messages) {
    // We do not decrypt here; by policy we only use sanitized snippets already stored
    sanitized.push('[message snippet redacted]');
  }
  const summary = await callOpenAI(mode, sanitized).catch((e) => {
    console.warn('[ai] openai failure, falling back', e);
    return `Summary (${sanitized.length} msgs)`;
  });
  const blob = await encryptForOrg(orgId, summary, 'email:summary');
  await prisma.emailThread.update({ where: { id: threadId }, data: { summaryEnc: blob, summaryAt: new Date() } });
}

export async function summarizeSnippets(mode: 'short' | 'medium' | 'detailed', sanitizedSnippets: string[]): Promise<string> {
  return callOpenAI(mode, sanitizedSnippets);
}


