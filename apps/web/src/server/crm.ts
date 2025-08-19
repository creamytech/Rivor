import { prisma } from './db';
import { encryptForOrg, decryptForOrg } from './crypto';

export interface CRMContact {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

async function getOAuthTokens(orgId: string, provider: 'hubspot' | 'salesforce') {
  const org = await prisma.org.findUnique({ where: { id: orgId } });
  if (!org) throw new Error('Organization not found');

  const account = await prisma.oAuthAccount.findFirst({
    where: {
      provider,
      userId: org.name // org.name stores owner email
    }
  });

  if (!account) throw new Error(`${provider} OAuth account not found`);

  const accessTokenBytes = await decryptForOrg(orgId, account.accessToken, `oauth:${provider}:access`);
  const refreshTokenBytes = account.refreshToken
    ? await decryptForOrg(orgId, account.refreshToken, `oauth:${provider}:refresh`)
    : undefined;

  const accessToken = new TextDecoder().decode(accessTokenBytes);
  const refreshToken = refreshTokenBytes ? new TextDecoder().decode(refreshTokenBytes) : undefined;

  return { accessToken, refreshToken, account };
}

export class HubSpotConnector {
  constructor(private accessToken: string) {}

  async listContacts(limit = 100): Promise<CRMContact[]> {
    const res = await fetch(`https://api.hubspot.com/crm/v3/objects/contacts?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error('HubSpot API error');
    const data = await res.json();
    return (data.results || []).map((c: any) => ({
      id: c.id,
      email: c.properties?.email,
      firstName: c.properties?.firstname,
      lastName: c.properties?.lastname,
      phone: c.properties?.phone
    }));
  }
}

export class SalesforceConnector {
  constructor(private accessToken: string, private instanceUrl: string) {}

  async listContacts(limit = 100): Promise<CRMContact[]> {
    const soql = encodeURIComponent(`SELECT Id, FirstName, LastName, Email, Phone FROM Contact LIMIT ${limit}`);
    const res = await fetch(`${this.instanceUrl}/services/data/v58.0/query/?q=${soql}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Salesforce API error');
    const data = await res.json();
    return (data.records || []).map((c: any) => ({
      id: c.Id,
      email: c.Email,
      firstName: c.FirstName,
      lastName: c.LastName,
      phone: c.Phone
    }));
  }
}

export async function createHubSpotConnector(orgId: string) {
  const { accessToken } = await getOAuthTokens(orgId, 'hubspot');
  return new HubSpotConnector(accessToken);
}

export async function createSalesforceConnector(orgId: string) {
  const { accessToken, account } = await getOAuthTokens(orgId, 'salesforce');
  const instanceUrl = account.providerId || process.env.SALESFORCE_INSTANCE_URL || '';
  return new SalesforceConnector(accessToken, instanceUrl);
}

export async function syncContacts(orgId: string, provider: 'hubspot' | 'salesforce') {
  const connector =
    provider === 'hubspot'
      ? await createHubSpotConnector(orgId)
      : await createSalesforceConnector(orgId);

  const contacts = await connector.listContacts();

  for (const c of contacts) {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ');
    await prisma.contact.create({
      data: {
        orgId,
        nameEnc: name ? await encryptForOrg(orgId, name, 'contact:name') : undefined,
        emailEnc: c.email ? await encryptForOrg(orgId, c.email, 'contact:email') : undefined,
        phoneEnc: c.phone ? await encryptForOrg(orgId, c.phone, 'contact:phone') : undefined,
        source: provider
      }
    });
  }
}

export async function exportContacts(orgId: string) {
  const contacts = await prisma.contact.findMany({ where: { orgId } });
  return contacts;
}

