import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import { encryptForOrg } from "./crypto";

// Custom adapter that encrypts OAuth tokens before storing
export function createCustomPrismaAdapter() {
  const adapter = PrismaAdapter(prisma);

  // Override the linkAccount method to encrypt tokens and map to encrypted fields
  adapter.linkAccount = async (account) => {
    console.log('🔗 Starting linkAccount with data:', {
      provider: account.provider,
      userId: account.userId,
      providerAccountId: account.providerAccountId,
      hasAccessToken: !!account.access_token,
      hasRefreshToken: !!account.refresh_token,
      hasIdToken: !!account.id_token,
      tokenLengths: {
        access: account.access_token?.length || 0,
        refresh: account.refresh_token?.length || 0,
        id: account.id_token?.length || 0
      }
    });

    try {
      // Step 1: Get default org for encryption
      console.log('🔍 Looking for organization...');
      const defaultOrg = await prisma.org.findFirst({
        select: { id: true, name: true, encryptedDekBlob: true }
      });
      
      if (!defaultOrg) {
        console.error('❌ No organization found for token encryption');
        // Try to create default org as fallback
        console.log('🔧 Attempting to create default organization...');
        const { generateDek, createKmsClient } = await import('@rivor/crypto');
        const kmsClient = createKmsClient();
        const { encryptedDekBlob, dekVersion } = await generateDek(kmsClient);
        
        const newOrg = await prisma.org.create({
          data: {
            id: 'default',
            name: 'Default Organization',
            slug: 'default',
            encryptedDekBlob,
            dekVersion,
            ephemeralMode: true,
            retentionDays: 90
          }
        });
        console.log('✅ Created default org:', newOrg.id);
        defaultOrg.id = newOrg.id;
        defaultOrg.name = newOrg.name;
      }

      console.log('🏢 Using org for KMS encryption:', {
        orgId: defaultOrg.id,
        orgName: defaultOrg.name
      });

      // Step 2: Encrypt OAuth tokens using KMS
      console.log('🔒 Starting token encryption...');
      
      let access_token_enc = null;
      let refresh_token_enc = null;
      let id_token_enc = null;

      if (account.access_token) {
        console.log('🔐 Encrypting access token...');
        access_token_enc = await encryptForOrg(
          defaultOrg.id, 
          new TextEncoder().encode(account.access_token), 
          `oauth:${account.provider}:access`
        );
        console.log('✅ Access token encrypted, size:', access_token_enc.length);
      }

      if (account.refresh_token) {
        console.log('🔐 Encrypting refresh token...');
        refresh_token_enc = await encryptForOrg(
          defaultOrg.id, 
          new TextEncoder().encode(account.refresh_token), 
          `oauth:${account.provider}:refresh`
        );
        console.log('✅ Refresh token encrypted, size:', refresh_token_enc.length);
      }

      if (account.id_token) {
        console.log('🔐 Encrypting ID token...');
        id_token_enc = await encryptForOrg(
          defaultOrg.id, 
          new TextEncoder().encode(account.id_token), 
          `oauth:${account.provider}:id`
        );
        console.log('✅ ID token encrypted, size:', id_token_enc.length);
      }

      // Step 3: Create Account record
      console.log('💾 Creating Account record in database...');
      const createdAccount = await prisma.account.create({
        data: {
          userId: account.userId!,
          type: account.type!,
          provider: account.provider!,
          providerAccountId: account.providerAccountId!,
          access_token_enc,
          refresh_token_enc,
          id_token_enc,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          session_state: account.session_state,
        }
      });

      console.log('✅ Account created successfully:', {
        id: createdAccount.id,
        provider: createdAccount.provider,
        userId: createdAccount.userId,
        hasEncryptedTokens: {
          access: !!createdAccount.access_token_enc,
          refresh: !!createdAccount.refresh_token_enc,
          id: !!createdAccount.id_token_enc
        }
      });
      
      return createdAccount;

    } catch (error) {
      console.error('❌ Critical linkAccount failure:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        provider: account.provider,
        userId: account.userId
      });
      
      // For debugging: don't throw immediately, log more details
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          cause: error.cause
        });
      }
      
      throw error; // Still fail securely, but with better logging
    }
  };

  return adapter;
}