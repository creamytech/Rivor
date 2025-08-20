import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { logger } from "@/lib/logger";
import { encryptForOrg, decryptForOrg } from "@/server/crypto";

interface RouteParams {
  params: {
    documentId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    const { documentId } = params;

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        orgId,
      },
      include: {
        folder: true,
        template: true,
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Decrypt sensitive fields
    const decryptedDocument = {
      ...document,
      name: await decryptForOrg(document.name, orgId),
      content: await decryptForOrg(document.content, orgId),
      generatedPdfUrl: document.generatedPdfUrl ? await decryptForOrg(document.generatedPdfUrl, orgId) : null,
    };

    logger.info('Document fetched', {
      userId: session.user?.email,
      orgId,
      documentId
    });

    return NextResponse.json(decryptedDocument);

  } catch (error) {
    logger.error('Failed to fetch document', { error, documentId: params.documentId });
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    const { documentId } = params;
    const data = await request.json();

    // Check if document exists and belongs to org
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: documentId,
        orgId,
      }
    });

    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Prepare update data with encryption for sensitive fields
    const updateData: any = {};
    
    if (data.name !== undefined) {
      updateData.name = await encryptForOrg(data.name, orgId);
    }
    if (data.content !== undefined) {
      updateData.content = await encryptForOrg(data.content, orgId);
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.folderId !== undefined) {
      updateData.folderId = data.folderId;
    }
    if (data.linkedDealId !== undefined) {
      updateData.linkedDealId = data.linkedDealId;
    }
    if (data.linkedContactId !== undefined) {
      updateData.linkedContactId = data.linkedContactId;
    }
    if (data.generatedPdfUrl !== undefined) {
      updateData.generatedPdfUrl = data.generatedPdfUrl ? await encryptForOrg(data.generatedPdfUrl, orgId) : null;
    }
    if (data.docusignEnvelopeId !== undefined) {
      updateData.docusignEnvelopeId = data.docusignEnvelopeId;
    }
    if (data.signedAt !== undefined) {
      updateData.signedAt = data.signedAt ? new Date(data.signedAt) : null;
    }

    // Update document
    const document = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        folder: true,
        template: true,
      }
    });

    // Return decrypted data
    const decryptedDocument = {
      ...document,
      name: await decryptForOrg(document.name, orgId),
      content: await decryptForOrg(document.content, orgId),
      generatedPdfUrl: document.generatedPdfUrl ? await decryptForOrg(document.generatedPdfUrl, orgId) : null,
    };

    logger.info('Document updated', {
      userId: session.user?.email,
      orgId,
      documentId,
      changes: Object.keys(updateData)
    });

    return NextResponse.json(decryptedDocument);

  } catch (error) {
    logger.error('Failed to update document', { error, documentId: params.documentId });
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    const { documentId } = params;

    // Check if document exists and belongs to org
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: documentId,
        orgId,
      }
    });

    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete document
    await prisma.document.delete({
      where: { id: documentId }
    });

    logger.info('Document deleted', {
      userId: session.user?.email,
      orgId,
      documentId
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Failed to delete document', { error, documentId: params.documentId });
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}