require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');

/**
 * Database seed script for minimal bootstrap data
 * Milestone D requirement: Creates default pipeline stages
 * 
 * Usage:
 * - npm run db:seed (in development/staging)
 * - SEED_MODE=production npm run db:seed (production)
 * 
 * Only runs in non-production environments unless explicitly enabled
 */

const prisma = new PrismaClient().$extends(withAccelerate());

const defaultPipelineStages = [
  { name: 'Lead', order: 1, color: '#10B981' },     // green
  { name: 'Qualified', order: 2, color: '#3B82F6' }, // blue
  { name: 'Proposal', order: 3, color: '#F59E0B' },  // amber
  { name: 'Negotiation', order: 4, color: '#EF4444' }, // red
  { name: 'Closed Won', order: 5, color: '#8B5CF6' }, // purple
  { name: 'Closed Lost', order: 6, color: '#6B7280' } // gray
];

async function seedPipelineStages(orgId) {
  console.log(`🌱 Seeding default pipeline stages for org: ${orgId}`);
  
  const existingStages = await prisma.pipelineStage.findMany({
    where: { orgId }
  });

  if (existingStages.length > 0) {
    console.log(`⏭️  Org ${orgId} already has ${existingStages.length} pipeline stages, skipping`);
    return existingStages;
  }

  const createdStages = [];
  for (const stage of defaultPipelineStages) {
    const created = await prisma.pipelineStage.create({
      data: {
        ...stage,
        orgId
      }
    });
    createdStages.push(created);
    console.log(`  ✅ Created stage: ${stage.name} (order: ${stage.order})`);
  }

  return createdStages;
}

async function seedDefaultUser() {
  console.log('🌱 Creating default seed user...');
  
  // Check if any users exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('⏭️  Users already exist, skipping default user creation');
    return null;
  }

  // Create default user
  const user = await prisma.user.create({
    data: {
      email: 'seed@example.com',
      name: 'Seed User',
      emailVerified: new Date()
    }
  });

  console.log('  ✅ Created default user:', user.email);
  return user;
}

async function seedDefaultOrg(user) {
  console.log('🌱 Creating default organization...');
  
  const existingOrgs = await prisma.org.count();
  if (existingOrgs > 0) {
    console.log('⏭️  Organizations already exist, returning first org');
    return await prisma.org.findFirst();
  }

  // Create minimal org (encryption will be handled by app logic)
  const org = await prisma.org.create({
    data: {
      name: 'Seed Organization',
      brandName: 'Rivor',
      encryptedDekBlob: Buffer.from('placeholder-will-be-replaced-by-app'),
      retentionDays: 365
    }
  });

  // Create org membership for the user if user was provided
  if (user) {
    await prisma.orgMember.create({
      data: {
        orgId: org.id,
        userId: user.id,
        role: 'admin'
      }
    });
    console.log('  ✅ Created org membership for seed user');
  }

  console.log('  ✅ Created default organization:', org.name);
  return org;
}

async function runSeed() {
  const isProduction = process.env.NODE_ENV === 'production';
  const seedMode = process.env.SEED_MODE;
  
  console.log('🌱 Starting database seed...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Seed mode: ${seedMode || 'default'}`);

  // Safety check for production
  if (isProduction && seedMode !== 'production') {
    console.log('⚠️  Production environment detected but SEED_MODE=production not set');
    console.log('💡 To seed in production, run: SEED_MODE=production npm run db:seed');
    console.log('🛑 Exiting without seeding for safety');
    return;
  }

  try {
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Seed default user (only in non-production)
    let user = null;
    if (!isProduction) {
      user = await seedDefaultUser();
    }

    // Seed default org
    const org = await seedDefaultOrg(user);
    
    // Seed pipeline stages for the org
    await seedPipelineStages(org.id);

    // Find all orgs and seed pipeline stages for each
    const allOrgs = await prisma.org.findMany();
    for (const orgItem of allOrgs) {
      if (orgItem.id !== org.id) {
        await seedPipelineStages(orgItem.id);
      }
    }

    console.log('🎉 Database seed completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`  - ${allOrgs.length} organizations`);
    console.log(`  - ${defaultPipelineStages.length} pipeline stages per org`);
    
    if (!isProduction) {
      console.log(`  - 1 seed user created`);
    }

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export functions for programmatic use
module.exports = {
  seedPipelineStages,
  seedDefaultUser,
  seedDefaultOrg,
  runSeed
};

// Run seed when called directly
if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}
