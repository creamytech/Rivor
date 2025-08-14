import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface EncryptionResult {
  iv: Uint8Array;
  authTag: Uint8Array;
  ciphertext: Uint8Array;
}

export function aes256gcmEncrypt(plaintext: Uint8Array, dek: Uint8Array, aad?: Uint8Array): EncryptionResult {
  if (dek.length !== 32) throw new Error('DEK must be 32 bytes for AES-256-GCM');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', dek, iv);
  if (aad) cipher.setAAD(Buffer.from(aad));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { iv: new Uint8Array(iv), authTag: new Uint8Array(authTag), ciphertext: new Uint8Array(ciphertext) };
}

export function aes256gcmDecrypt(enc: EncryptionResult, dek: Uint8Array, aad?: Uint8Array): Uint8Array {
  if (dek.length !== 32) throw new Error('DEK must be 32 bytes for AES-256-GCM');
  const decipher = createDecipheriv('aes-256-gcm', dek, Buffer.from(enc.iv));
  if (aad) decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(enc.authTag));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(enc.ciphertext)), decipher.final()]);
  return new Uint8Array(plaintext);
}

// Helpers to pack/unpack encrypted blobs for DB storage
// Format: [version=1][iv(12)][tag(16)][ciphertext(n)]
export function packEncryptedBlob(enc: EncryptionResult): Uint8Array {
  return Buffer.concat([Buffer.from([1]), Buffer.from(enc.iv), Buffer.from(enc.authTag), Buffer.from(enc.ciphertext)]);
}

export function unpackEncryptedBlob(blob: Uint8Array): EncryptionResult {
  const buf = Buffer.from(blob);
  if (buf.length < 1 + 12 + 16) throw new Error('Invalid encrypted blob');
  const version = buf.readUInt8(0);
  if (version !== 1) throw new Error('Unsupported encrypted blob version');
  return {
    iv: new Uint8Array(buf.subarray(1, 13)),
    authTag: new Uint8Array(buf.subarray(13, 29)),
    ciphertext: new Uint8Array(buf.subarray(29)),
  };
}
