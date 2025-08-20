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
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const whereClause: any = { orgId };
    
    if (!includeArchived) {
      whereClause.isArchived = false;
    }

    const folders = await prisma.documentFolder.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    // Decrypt sensitive fields and get document counts
    const decryptedFolders = await Promise.all(
      folders.map(async (folder) => {
        // Get document count for this folder
        const documentCount = await prisma.document.count({
          where: {
            folderId: folder.id,
            orgId
          }
        });

        return {
          ...folder,
          name: await decryptForOrg(folder.name, orgId),
          documentCount,
        };
      })
    );

    logger.info('Document folders fetched', {
      userId: session.user?.email,
      orgId,
      count: folders.length,
      includeArchived
    });

    return NextResponse.json({ folders: decryptedFolders });

  } catch (error) {
    logger.error('Failed to fetch document folders', { error });
    return NextResponse.json(
      { error: "Failed to fetch document folders" },
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
    if (!data.name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Validate parent folder exists if provided
    if (data.parentId) {
      const parentFolder = await prisma.documentFolder.findFirst({
        where: {
          id: data.parentId,
          orgId
        }
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        );
      }
    }

    // Create folder with encrypted sensitive fields
    const folder = await prisma.documentFolder.create({
      data: {
        name: await encryptForOrg(data.name, orgId),
        parentId: data.parentId || null,
        linkedDealId: data.linkedDealId || null,
        linkedContactId: data.linkedContactId || null,
        color: data.color || null,
        isArchived: false,
        orgId,
      }
    });

    // Return decrypted data for immediate use
    const decryptedFolder = {
      ...folder,
      name: await decryptForOrg(folder.name, orgId),
      documentCount: 0, // New folder has no documents
      subfolders: [], // New folder has no subfolders
    };

    logger.info('Document folder created', {
      userId: session.user?.email,
      orgId,
      folderId: folder.id,
      parentId: data.parentId
    });

    return NextResponse.json(decryptedFolder, { status: 201 });

  } catch (error) {
    logger.error('Failed to create document folder', { error });
    return NextResponse.json(
      { error: "Failed to create document folder" },
      { status: 500 }
    );
  }
}