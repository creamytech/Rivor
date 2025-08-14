export * from './kms';
export * from './fle';

export function generateDek(): Uint8Array {
	const crypto = require('crypto') as typeof import('crypto');
	return new Uint8Array(crypto.randomBytes(32));
}
