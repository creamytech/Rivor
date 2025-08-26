const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function debugAuth() {
  console.log('🔍 Debugging authentication issue...\n');
  
  try {
    // Check users
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    console.log('👥 Recent users:', users);

    // Check sessions
    const sessions = await prisma.session.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sessionToken: true,
        userId: true,
        expires: true,
        createdAt: true
      }
    });
    console.log('\n🗝️ Recent sessions:', sessions);

    // Check accounts
    const accounts = await prisma.account.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        userId: true,
        type: true,
        createdAt: true
      }
    });
    console.log('\n🔗 Recent accounts:', accounts);

    // Check if user with your email exists
    const yourUser = await prisma.user.findUnique({
      where: { email: 'benjaminscott18@gmail.com' },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        accounts: {
          select: {
            provider: true,
            type: true,
            createdAt: true
          }
        }
      }
    });
    console.log('\n👤 Your user account:', yourUser);

  } catch (error) {
    console.error('❌ Error debugging auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();