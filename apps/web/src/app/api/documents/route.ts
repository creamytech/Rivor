import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { logger } from "@/lib/logger";
import { encryptForOrg, decryptForOrg } from "@/server/crypto";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const status = searchParams.get('status');
    const linkedDealId = searchParams.get('linkedDealId');
    const linkedContactId = searchParams.get('linkedContactId');

    const whereClause: any = { orgId };
    
    if (folderId) {
      whereClause.folderId = folderId;
    }
    if (status) {
      whereClause.status = status;
    }
    if (linkedDealId) {
      whereClause.linkedDealId = linkedDealId;
    }
    if (linkedContactId) {
      whereClause.linkedContactId = linkedContactId;
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        folder: true,
        template: true,
      }
    });

    // Decrypt sensitive fields
    const decryptedDocuments = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        name: await decryptForOrg(doc.name, orgId),
        content: await decryptForOrg(doc.content, orgId),
        generatedPdfUrl: doc.generatedPdfUrl ? await decryptForOrg(doc.generatedPdfUrl, orgId) : null,
      }))
    );

    logger.info('Documents fetched', {
      userId: session.user?.email,
      orgId,
      count: documents.length,
      filters: { folderId, status, linkedDealId, linkedContactId }
    });

    return NextResponse.json({ documents: decryptedDocuments });

  } catch (error) {
    logger.error('Failed to fetch documents', { error });
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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

    // Create document with encrypted sensitive fields
    const document = await prisma.document.create({
      data: {
        name: await encryptForOrg(data.name, orgId),
        content: await encryptForOrg(data.content, orgId),
        status: data.status || 'draft',
        templateId: data.templateId || null,
        linkedDealId: data.linkedDealId || null,
        linkedContactId: data.linkedContactId || null,
        folderId: data.folderId || null,
        orgId,
      },
      include: {
        folder: true,
        template: true,
      }
    });

    // Return decrypted data for immediate use
    const decryptedDocument = {
      ...document,
      name: await decryptForOrg(document.name, orgId),
      content: await decryptForOrg(document.content, orgId),
    };

    logger.info('Document created', {
      userId: session.user?.email,
      orgId,
      documentId: document.id,
      templateId: data.templateId
    });

    return NextResponse.json(decryptedDocument, { status: 201 });

  } catch (error) {
    logger.error('Failed to create document', { error });
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}