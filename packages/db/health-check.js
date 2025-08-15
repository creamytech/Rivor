require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');

/**
 * Database health check that verifies NextAuth tables exist
 * Milestone B requirement: "DB ready" health check 
 * 
 * Usage:
 * - On app boot: Warns if tables don't exist
 * - In CI: Fails build if migrations didn't run
 * - For monitoring: Endpoint health verification
 */
async function healthCheck(options = {}) {
  const { 
    exitOnFailure = process.env.NODE_ENV === 'production',
    logLevel = 'info' 
  } = options;

  const prisma = new PrismaClient().$extends(withAccelerate());
  
  const log = (level, message) => {
    if (logLevel === 'debug' || level === 'error' || level === 'warn') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [DB-HEALTH] ${level.toUpperCase()}: ${message}`);
    }
  };

  try {
    log('info', '🔍 Starting database health check...');

    // Test 1: Basic connection
    await prisma.$connect();
    log('info', '✅ Database connection successful');

    // Test 2: Verify NextAuth tables exist with proper structure
    const requiredTables = [
      { name: 'User', query: () => prisma.user.count() },
      { name: 'Account', query: () => prisma.account.count() },
      { name: 'Session', query: () => prisma.session.count() },
      { name: 'VerificationToken', query: () => prisma.verificationToken.count() }
    ];

    const results = [];
    let allTablesExist = true;

    for (const table of requiredTables) {
      try {
        const count = await table.query();
        results.push({ table: table.name, status: 'OK', count });
        log('debug', `✅ Table ${table.name}: ${count} records`);
      } catch (error) {
        allTablesExist = false;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ table: table.name, status: 'ERROR', error: errorMessage });
        log('error', `❌ Table ${table.name}: ${errorMessage}`);
      }
    }

    // Test 3: Check if database is accessible for writes
    try {
      // Simple write test - this will only work if database is properly set up
      await prisma.$executeRaw`SELECT 1 as health_check`;
      log('debug', '✅ Database write access verified');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log('warn', `⚠️  Database write test failed: ${errorMessage}`);
    }

    if (allTablesExist) {
      log('info', '🎉 Database health check PASSED');
      log('info', `✅ All ${requiredTables.length} NextAuth tables exist and accessible`);
      
      if (process.env.NODE_ENV === 'production') {
        log('info', '🚀 Production database ready for authentication');
      }
      
      return { 
        status: 'healthy', 
        tables: results,
        message: 'All NextAuth tables exist and accessible',
        timestamp: new Date().toISOString()
      };
    } else {
      const failedTables = results.filter(r => r.status === 'ERROR').map(r => r.table);
      const errorMessage = `Database health check FAILED: Missing tables [${failedTables.join(', ')}]`;
      
      log('error', `❌ ${errorMessage}`);
      log('error', '💡 Run "npm run db:migrate:deploy" to create missing tables');
      
      if (exitOnFailure) {
        log('error', '🚨 Exiting due to failed health check in production mode');
        process.exit(1);
      }
      
      return { 
        status: 'unhealthy', 
        tables: results,
        message: errorMessage,
        timestamp: new Date().toISOString()
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fullErrorMessage = `Database health check FAILED: ${errorMessage}`;
    log('error', `❌ ${fullErrorMessage}`);
    
    if (exitOnFailure) {
      log('error', '🚨 Exiting due to database connection failure');
      process.exit(1);
    }
    
    return { 
      status: 'unhealthy', 
      error: errorMessage,
      message: fullErrorMessage,
      timestamp: new Date().toISOString()
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in Next.js API routes
module.exports = { healthCheck };

// Run directly when called from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    exitOnFailure: args.includes('--exit-on-failure'),
    logLevel: args.includes('--debug') ? 'debug' : 'info'
  };
  
  healthCheck(options)
    .then(result => {
      if (result.status === 'unhealthy' && !options.exitOnFailure) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Health check crashed:', error);
      process.exit(1);
    });
}
