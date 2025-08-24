import { PrismaClient } from '@prisma/client';
import { createKmsClient, generateDek } from '@rivor/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create default organization with KMS encryption
  console.log('📦 Creating default organization...');
  
  let defaultOrg = await prisma.org.findFirst();
  
  if (!defaultOrg) {
    // Generate DEK for the organization
    const kmsClient = createKmsClient();
    const { encryptedDekBlob, dekVersion } = await generateDek(kmsClient);

    defaultOrg = await prisma.org.create({
      data: {
        name: 'Default Organization',
        slug: 'default',
        brandName: 'Rivor',
        encryptedDekBlob,
        dekVersion,
        ephemeralMode: false,
        retentionDays: 90,
      },
    });

    console.log('✅ Created default organization:', defaultOrg.id);
  } else {
    console.log('✅ Default organization already exists:', defaultOrg.id);
  }

  // 2. Verify essential database constraints and indexes exist
  console.log('🔍 Verifying database constraints...');
  
  // Check that Account table has the correct encrypted columns
  const accountColumns = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Account' 
    AND table_schema = 'public'
    ORDER BY column_name;
  `;
  
  console.log('📋 Account table columns:', accountColumns);

  // Check unique constraints exist
  const uniqueConstraints = await prisma.$queryRaw`
    SELECT constraint_name, table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'UNIQUE'
    AND table_schema = 'public'
    AND table_name IN ('User', 'Account', 'EmailAccount', 'CalendarAccount')
    ORDER BY table_name, constraint_name;
  `;
  
  console.log('🔐 Unique constraints:', uniqueConstraints);

  // 3. Create indexes for performance if they don't exist
  console.log('📊 Creating performance indexes...');
  
  try {
    // Index for OAuth lookups
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Account_provider_providerAccountId_idx" 
      ON "Account" ("provider", "providerAccountId");
    `;
    
    // Index for email account lookups
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "EmailAccount_orgId_provider_idx" 
      ON "EmailAccount" ("orgId", "provider");
    `;
    
    // Index for calendar account lookups
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "CalendarAccount_orgId_provider_idx" 
      ON "CalendarAccount" ("orgId", "provider");
    `;

    console.log('✅ Performance indexes created/verified');
  } catch (error) {
    console.log('⚠️  Some indexes may already exist:', error.message);
  }

  // 4. Database health check
  console.log('🏥 Running database health check...');
  
  const stats = {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    orgs: await prisma.org.count(),
    emailAccounts: await prisma.emailAccount.count(),
    calendarAccounts: await prisma.calendarAccount.count(),
    emailThreads: await prisma.emailThread.count(),
    calendarEvents: await prisma.calendarEvent.count(),
  };
  
  console.log('📊 Database statistics:', stats);

  // 5. Configuration validation
  console.log('⚙️  Validating configuration...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'KMS_KEY_ID'
  ];
  
  const missingEnv = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnv.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnv);
    process.exit(1);
  }
  
  console.log('✅ All required environment variables present');

  console.log('🎉 Database seeding completed successfully!');
  console.log(`📋 Summary:
  - Default org: ${defaultOrg.name} (${defaultOrg.id})
  - Users: ${stats.users}
  - OAuth accounts: ${stats.accounts}
  - Email accounts: ${stats.emailAccounts}
  - Calendar accounts: ${stats.calendarAccounts}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });