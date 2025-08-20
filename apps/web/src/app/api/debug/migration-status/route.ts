import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check migration status
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if _prisma_migrations table exists
    let migrationsTable = 'unknown';
    let appliedMigrations: string[] = [];
    
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at 
        FROM _prisma_migrations 
        ORDER BY finished_at DESC
      ` as Array<{ migration_name: string; finished_at: Date | null }>;
      
      migrationsTable = 'exists';
      appliedMigrations = migrations.map(m => m.migration_name);
    } catch (error) {
      migrationsTable = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    // Check specific table columns to determine schema version
    let emailAccountColumns: string[] = [];
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'EmailAccount' AND table_schema = 'public'
        ORDER BY column_name
      ` as Array<{ column_name: string }>;
      
      emailAccountColumns = columns.map(c => c.column_name);
    } catch (error) {
      emailAccountColumns = [`error: ${error instanceof Error ? error.message : 'unknown'}`];
    }

    // Determine schema version based on columns
    const hasModernFields = emailAccountColumns.includes('tokenStatus') && 
                           emailAccountColumns.includes('encryptionStatus');
    
    const schemaVersion = hasModernFields ? 'modern' : 'basic';

    // Check database connection info
    let dbInfo = 'unknown';
    try {
      const result = await prisma.$queryRaw`SELECT current_database(), current_schema()` as Array<{ current_database: string; current_schema: string }>;
      dbInfo = result[0] ? `${result[0].current_database}/${result[0].current_schema}` : 'no result';
    } catch (error) {
      dbInfo = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    return NextResponse.json({
      migrationsTable,
      appliedMigrations,
      emailAccountColumns,
      schemaVersion,
      dbInfo,
      databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + '...' || 'not set',
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Migration status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
