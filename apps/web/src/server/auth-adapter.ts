import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import { encryptForOrg } from "./crypto";
import { logOAuth } from "@/lib/oauth-logger";

// Custom adapter that encrypts OAuth tokens before storing
export function createCustomPrismaAdapter() {
  const adapter = PrismaAdapter(prisma);

  // Override the linkAccount method to encrypt tokens and map to encrypted fields
  adapter.linkAccount = async (account) => {
    const linkData = {
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
    };
    
    logOAuth('info', '🔗 Starting linkAccount with data', linkData);
    console.log('🔗 Starting linkAccount with data:', linkData);

    try {
      // Step 1: Get default org for encryption
      logOAuth('info', '🔍 Looking for organization...');
      console.log('🔍 Looking for organization...');
      const defaultOrg = await prisma.org.findFirst({
        select: { id: true, name: true, encryptedDekBlob: true }
      });
      
      if (!defaultOrg) {
        logOAuth('warn', '❌ No organization found for token encryption');
        console.error('❌ No organization found for token encryption');
        // Try to create default org as fallback
        logOAuth('info', '🔧 Attempting to create default organization...');
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
        logOAuth('info', '✅ Created default org', { orgId: newOrg.id });
        console.log('✅ Created default org:', newOrg.id);
        defaultOrg.id = newOrg.id;
        defaultOrg.name = newOrg.name;
      }

      const orgData = {
        orgId: defaultOrg.id,
        orgName: defaultOrg.name
      };
      logOAuth('info', '🏢 Using org for KMS encryption', orgData);
      console.log('🏢 Using org for KMS encryption:', orgData);

      // Step 2: Encrypt OAuth tokens using KMS
      logOAuth('info', '🔒 Starting token encryption...');
      console.log('🔒 Starting token encryption...');
      
      let access_token_enc = null;
      let refresh_token_enc = null;
      let id_token_enc = null;

      if (account.access_token) {
        logOAuth('info', '🔐 Encrypting access token...');
        console.log('🔐 Encrypting access token...');
        access_token_enc = await encryptForOrg(
          defaultOrg.id, 
          new TextEncoder().encode(account.access_token), 
          `oauth:${account.provider}:access`
        );
        logOAuth('info', '✅ Access token encrypted', { size: access_token_enc.length });
        console.log('✅ Access token encrypted, size:', access_token_enc.length);
      }

      if (account.refresh_token) {
        logOAuth('info', '🔐 Encrypting refresh token...');
        console.log('🔐 Encrypting refresh token...');
        refresh_token_enc = await encryptForOrg(
          defaultOrg.id, 
          new TextEncoder().encode(account.refresh_token), 
          `oauth:${account.provider}:refresh`
        );
        logOAuth('info', '✅ Refresh token encrypted', { size: refresh_token_enc.length });
        console.log('✅ Refresh token encrypted, size:', refresh_token_enc.length);
      }

      if (account.id_token) {
        logOAuth('info', '🔐 Encrypting ID token...');
        console.log('🔐 Encrypting ID token...');
        id_token_enc = await encryptForOrg(
          defaultOrg.id, 
          new TextEncoder().encode(account.id_token), 
          `oauth:${account.provider}:id`
        );
        logOAuth('info', '✅ ID token encrypted', { size: id_token_enc.length });
        console.log('✅ ID token encrypted, size:', id_token_enc.length);
      }

      // Step 3: Create Account record
      logOAuth('info', '💾 Creating Account record in database...');
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

      const successData = {
        id: createdAccount.id,
        provider: createdAccount.provider,
        userId: createdAccount.userId,
        hasEncryptedTokens: {
          access: !!createdAccount.access_token_enc,
          refresh: !!createdAccount.refresh_token_enc,
          id: !!createdAccount.id_token_enc
        }
      };
      logOAuth('info', '✅ Account created successfully', successData);
      console.log('✅ Account created successfully:', successData);
      
      return createdAccount;

    } catch (error) {
      const errorData = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        provider: account.provider,
        userId: account.userId
      };
      
      logOAuth('error', '❌ Critical linkAccount failure', errorData);
      console.error('❌ Critical linkAccount failure:', errorData);
      
      // For debugging: don't throw immediately, log more details
      if (error instanceof Error) {
        const errorDetails = {
          name: error.name,
          message: error.message,
          cause: error.cause
        };
        logOAuth('error', 'Error details', errorDetails);
        console.error('Error details:', errorDetails);
      }
      
      throw error; // Still fail securely, but with better logging
    }
  };

  return adapter;
}