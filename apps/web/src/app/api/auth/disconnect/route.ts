import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await req.json();
    if (!provider || !['google', 'azure-ad'].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const userEmail = session.user.email;

    // Find and delete the OAuth account
    const existingAccount = await prisma.oAuthAccount.findFirst({
      where: {
        userId: userEmail,
        provider: provider
      }
    });

    if (!existingAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Delete the OAuth account record
    await prisma.oAuthAccount.delete({
      where: {
        id: existingAccount.id
      }
    });

    logger.info('OAuth account disconnected', {
      userId: userEmail,
      provider,
      action: 'oauth_disconnect'
    });

    return NextResponse.json({ 
      success: true, 
      message: `${provider} account disconnected successfully` 
    });

  } catch (error) {
    logger.error('OAuth disconnect error', error as Error, { 
      action: 'oauth_disconnect_error' 
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
