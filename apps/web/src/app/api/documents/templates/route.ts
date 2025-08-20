import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { logger } from "@/lib/logger";
import { encryptForOrg, decryptForOrg } from "@/server/crypto";
import { createDefaultTemplates } from "@/server/documents";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active') === 'true';

    const whereClause: any = { orgId };
    
    if (category) {
      whereClause.category = category;
    }
    if (activeOnly) {
      whereClause.isActive = true;
    }

    const templates = await prisma.documentTemplate.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    });

    // If no templates exist, create default ones
    if (templates.length === 0) {
      await createDefaultTemplates(orgId);
      // Re-fetch templates after creating defaults
      const newTemplates = await prisma.documentTemplate.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' }
      });
      
      // Decrypt and return
      const decryptedTemplates = await Promise.all(
        newTemplates.map(async (template) => ({
          ...template,
          name: await decryptForOrg(template.name, orgId),
          description: await decryptForOrg(template.description, orgId),
          content: await decryptForOrg(template.content, orgId),
          mergeFields: JSON.parse(template.mergeFields),
          usageCount: 0, // New templates have no usage
        }))
      );

      return NextResponse.json({ templates: decryptedTemplates });
    }

    // Decrypt sensitive fields and get usage stats
    const decryptedTemplates = await Promise.all(
      templates.map(async (template) => {
        // Get usage count from documents using this template
        const usageCount = await prisma.document.count({
          where: {
            templateId: template.id,
            orgId
          }
        });

        // Get last used date
        const lastUsedDoc = await prisma.document.findFirst({
          where: {
            templateId: template.id,
            orgId
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });

        return {
          ...template,
          name: await decryptForOrg(template.name, orgId),
          description: await decryptForOrg(template.description, orgId),
          content: await decryptForOrg(template.content, orgId),
          mergeFields: JSON.parse(template.mergeFields),
          usageCount,
          lastUsed: lastUsedDoc?.createdAt || null,
        };
      })
    );

    logger.info('Document templates fetched', {
      userId: session.user?.email,
      orgId,
      count: templates.length,
      category,
      activeOnly
    });

    return NextResponse.json({ templates: decryptedTemplates });

  } catch (error) {
    logger.error('Failed to fetch document templates', { error });
    return NextResponse.json(
      { error: "Failed to fetch document templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    // Extract merge fields from content
    const mergeFieldRegex = /\{\{([^}]+)\}\}/g;
    const mergeFields = [...data.content.matchAll(mergeFieldRegex)].map(match => match[1]);
    const uniqueMergeFields = [...new Set(mergeFields)];

    // Create template with encrypted sensitive fields
    const template = await prisma.documentTemplate.create({
      data: {
        name: await encryptForOrg(data.name, orgId),
        description: await encryptForOrg(data.description || '', orgId),
        content: await encryptForOrg(data.content, orgId),
        category: data.category || 'other',
        mergeFields: JSON.stringify(uniqueMergeFields),
        isActive: data.isActive !== false,
        orgId,
      }
    });

    // Return decrypted data for immediate use
    const decryptedTemplate = {
      ...template,
      name: await decryptForOrg(template.name, orgId),
      description: await decryptForOrg(template.description, orgId),
      content: await decryptForOrg(template.content, orgId),
      mergeFields: uniqueMergeFields,
      usageCount: 0,
    };

    logger.info('Document template created', {
      userId: session.user?.email,
      orgId,
      templateId: template.id,
      category: data.category,
      mergeFieldCount: uniqueMergeFields.length
    });

    return NextResponse.json(decryptedTemplate, { status: 201 });

  } catch (error) {
    logger.error('Failed to create document template', { error });
    return NextResponse.json(
      { error: "Failed to create document template" },
      { status: 500 }
    );
  }
}