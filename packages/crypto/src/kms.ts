export type KmsProvider = 'gcp' | 'aws' | 'azure';

export interface KmsClient {
	decryptDek(encryptedDek: Uint8Array): Promise<Uint8Array>;
	encryptDek(plaintextDek: Uint8Array): Promise<Uint8Array>;
}

// Local AES-GCM wrapper using a provided 32-byte master key (from env KMS_KEY_ID).
// Format: [version=1][iv(12)][tag(16)][ciphertext(n)]
function createLocalWrapper(masterKey: Uint8Array): KmsClient {
	const crypto = require('crypto') as typeof import('crypto');
	if (masterKey.length !== 32) {
		throw new Error('KMS_KEY_ID must be a 32-byte key in base64 for local wrapper');
	}
	return {
		async encryptDek(plaintextDek: Uint8Array): Promise<Uint8Array> {
			const iv = crypto.randomBytes(12);
			const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
			const ciphertext = Buffer.concat([cipher.update(Buffer.from(plaintextDek)), cipher.final()]);
			const tag = cipher.getAuthTag();
			return Buffer.concat([Buffer.from([1]), iv, tag, ciphertext]);
		},
		async decryptDek(encryptedDek: Uint8Array): Promise<Uint8Array> {
			const buf = Buffer.from(encryptedDek);
			if (buf.length < 1 + 12 + 16) throw new Error('Invalid KMS-wrapped blob');
			const version = buf.readUInt8(0);
			if (version !== 1) throw new Error('Unsupported KMS blob version');
			const iv = buf.subarray(1, 13);
			const tag = buf.subarray(13, 29);
			const ciphertext = buf.subarray(29);
			const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
			decipher.setAuthTag(tag);
			const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
			return new Uint8Array(plaintext);
		},
	};
}

function createGcpKmsClient(cryptoKeyResource: string): KmsClient {
    // Lazy require to avoid bundling in clients where not needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { KeyManagementServiceClient } = require('@google-cloud/kms');
    const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const client = credsJson
        ? new KeyManagementServiceClient({ credentials: JSON.parse(Buffer.from(credsJson, 'base64').toString()) })
        : new KeyManagementServiceClient();
    return {
        async encryptDek(plaintextDek: Uint8Array): Promise<Uint8Array> {
            const [resp] = await client.encrypt({ name: cryptoKeyResource, plaintext: Buffer.from(plaintextDek) });
            const ct = resp.ciphertext as Uint8Array | Buffer | undefined;
            if (!ct) throw new Error('GCP KMS encrypt: missing ciphertext');
            return new Uint8Array(ct as Uint8Array);
        },
        async decryptDek(encryptedDek: Uint8Array): Promise<Uint8Array> {
            const [resp] = await client.decrypt({ name: cryptoKeyResource, ciphertext: Buffer.from(encryptedDek) });
            const pt = resp.plaintext as Uint8Array | Buffer | undefined;
            if (!pt) throw new Error('GCP KMS decrypt: missing plaintext');
            return new Uint8Array(pt as Uint8Array);
        },
    };
}

export function createKmsClient(provider: KmsProvider | undefined, keyId: string | undefined): KmsClient {
    // GCP KMS: keyId should be a CryptoKey resource name: projects/.../locations/.../keyRings/.../cryptoKeys/KEY
    if (provider === 'gcp' && keyId && keyId.startsWith('projects/')) {
        return createGcpKmsClient(keyId);
    }
    // Use local wrapper when env provides a base64 32-byte key.
    if (keyId) {
        const keyBytes = Buffer.from(keyId, 'base64');
        if (keyBytes.length === 32) {
            return createLocalWrapper(new Uint8Array(keyBytes));
        }
    }
    // Other providers not yet implemented
    return {
        async encryptDek() {
            throw new Error('Cloud KMS not configured. For GCP set KMS_PROVIDER=gcp and KMS_KEY_ID to the CryptoKey resource, or provide base64 32-byte KMS_KEY_ID for local wrapper.');
        },
        async decryptDek() {
            throw new Error('Cloud KMS not configured. For GCP set KMS_PROVIDER=gcp and KMS_KEY_ID to the CryptoKey resource, or provide base64 32-byte KMS_KEY_ID for local wrapper.');
        },
    };
}
