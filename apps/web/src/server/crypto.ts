import { prisma } from './db';
import { getEnv } from '@rivor/config/src/env';
import { createKmsClient } from '@rivor/crypto';
import { aes256gcmEncrypt, aes256gcmDecrypt, packEncryptedBlob, unpackEncryptedBlob } from '@rivor/crypto';

type DekCacheEntry = { dek: Uint8Array; expiresAtMs: number };

const dekCache = new Map<string, DekCacheEntry>();
const env = getEnv();
const kms = createKmsClient(env.KMS_PROVIDER, env.KMS_KEY_ID);

function nowMs() { return Date.now(); }

export async function getOrgDek(orgId: string): Promise<Uint8Array> {
  const cached = dekCache.get(orgId);
  if (cached && cached.expiresAtMs > nowMs()) return cached.dek;
  const org = await prisma.org.findUnique({ where: { id: orgId }, select: { encryptedDekBlob: true } });
  if (!org?.encryptedDekBlob) throw new Error('Org DEK not found');
  const dek = await kms.decryptDek(new Uint8Array(org.encryptedDekBlob));
  dekCache.set(orgId, { dek, expiresAtMs: nowMs() + env.ENCRYPTION_CACHE_TTL_SECONDS * 1000 });
  return dek;
}

export async function encryptForOrg(orgId: string, plaintext: Uint8Array | string, aadContext: string): Promise<Buffer> {
  const dek = await getOrgDek(orgId);
  const valueBytes = typeof plaintext === 'string' ? new TextEncoder().encode(plaintext) : plaintext;
  const aad = new TextEncoder().encode(`org:${orgId}:${aadContext}`);
  const enc = aes256gcmEncrypt(valueBytes, dek, aad);
  return Buffer.from(packEncryptedBlob(enc));
}

export async function decryptForOrg(orgId: string, blob: Uint8Array, aadContext: string): Promise<Uint8Array> {
  const dek = await getOrgDek(orgId);
  const aad = new TextEncoder().encode(`org:${orgId}:${aadContext}`);
  const enc = unpackEncryptedBlob(blob);
  return aes256gcmDecrypt(enc, dek, aad);
}


