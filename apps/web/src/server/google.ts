import { google } from 'googleapis';
import { prisma } from './db';
import { decryptForOrg, encryptForOrg } from './crypto';
import { getEnv } from './env';

export async function getGoogleOAuthClient(orgId: string, emailAccountId: string) {
  const env = getEnv();
  const account = await prisma.emailAccount.findUnique({ where: { id: emailAccountId } });
  if (!account) throw new Error('Email account not found');
  const oauth = await prisma.oAuthAccount.findFirst({ where: { provider: 'google', userId: account.id.split(':').pop()! } });
  if (!oauth) throw new Error('OAuth tokens not found');
  const access = oauth.accessToken ? await decryptForOrg(orgId, oauth.accessToken, 'oauth:access') : new Uint8Array();
  const refresh = oauth.refreshToken ? await decryptForOrg(orgId, oauth.refreshToken, 'oauth:refresh') : new Uint8Array();
  const client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.NEXTAUTH_URL || env.APP_URL);
  client.setCredentials({
    access_token: new TextDecoder().decode(access),
    refresh_token: new TextDecoder().decode(refresh),
  });
  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const blob = await encryptForOrg(orgId, tokens.access_token, 'oauth:access');
      await prisma.oAuthAccount.update({ where: { provider_providerId: { provider: 'google', providerId: oauth.providerId } }, data: { accessToken: blob, expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null } });
    }
    if (tokens.refresh_token) {
      const blob = await encryptForOrg(orgId, tokens.refresh_token, 'oauth:refresh');
      await prisma.oAuthAccount.update({ where: { provider_providerId: { provider: 'google', providerId: oauth.providerId } }, data: { refreshToken: blob } });
    }
  });
  return client;
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


