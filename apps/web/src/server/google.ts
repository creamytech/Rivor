import { google } from 'googleapis';
import { prisma } from './db';
import { decryptForOrg, encryptForOrg } from './crypto';
import { getEnv } from './env';
import { createGoogleOAuthClient } from './token-validation';
import { logger } from '@/lib/logger';

export async function getGoogleOAuthClient(orgId: string, emailAccountId: string) {
  const account = await prisma.emailAccount.findUnique({ where: { id: emailAccountId } });
  if (!account) throw new Error('Email account not found');
  
  // Find the OAuth account for this email account's organization
  const org = await prisma.org.findUnique({ where: { id: orgId } });
  if (!org) throw new Error('Organization not found');
  
  const oauth = await prisma.oAuthAccount.findFirst({ 
    where: { 
      provider: 'google', 
      userId: org.name // org.name is the user's email
    } 
  });
  
  if (!oauth) throw new Error('OAuth tokens not found');
  
  // Use the new validation-aware OAuth client
  return await createGoogleOAuthClient(orgId, oauth.id);
}

export async function listGmailThreads(orgId: string, emailAccountId: string, maxResults = 20) {
  const auth = await getGoogleOAuthClient(orgId, emailAccountId);
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.threads.list({ userId: 'me', maxResults });
  const threads = res.data.threads || [];
  return threads.map((t) => ({ id: t.id!, snippet: t.snippet || '' }));
}

export async function getGmailThread(orgId: string, emailAccountId: string, threadId: string) {
  const auth = await getGoogleOAuthClient(orgId, emailAccountId);
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'metadata', metadataHeaders: ['Subject','From','To','Date'] });
  return res.data;
}


