import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient({
	log: ['error', 'warn'],
	datasources: {
		db: {
			url: process.env.DATABASE_URL,
		},
	},
	// Production-optimized settings
	...(process.env.NODE_ENV === 'production' && {
		log: ['error'],
		errorFormat: 'minimal',
	}),
});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
