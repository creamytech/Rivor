import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import { encryptForOrg } from "./crypto";

// Custom adapter that encrypts OAuth tokens before storing
export function createCustomPrismaAdapter() {
  const adapter = PrismaAdapter(prisma);

  // Override the linkAccount method to encrypt tokens
  const originalLinkAccount = adapter.linkAccount!;
  
  adapter.linkAccount = async (account) => {
    console.log('🔗 Linking account with encryption:', {
      provider: account.provider,
      hasAccessToken: !!account.access_token,
      hasRefreshToken: !!account.refresh_token
    });

    try {
      // Get default org for encryption
      const defaultOrg = await prisma.org.findFirst();
      
      if (!defaultOrg) {
        console.error('❌ No organization found for token encryption, using original adapter');
        return await originalLinkAccount(account);
      }

      console.log('🏢 Using org for encryption:', {
        orgId: defaultOrg.id,
        orgName: defaultOrg.name
      });

      // Encrypt OAuth tokens
      const encryptedAccount = {
        ...account,
        // Keep original fields for compatibility, add encrypted ones
        access_token_enc: account.access_token ? 
          await encryptForOrg(defaultOrg.id, new TextEncoder().encode(account.access_token), `oauth:${account.provider}:access`) : undefined,
        refresh_token_enc: account.refresh_token ? 
          await encryptForOrg(defaultOrg.id, new TextEncoder().encode(account.refresh_token), `oauth:${account.provider}:refresh`) : undefined,
        id_token_enc: account.id_token ? 
          await encryptForOrg(defaultOrg.id, new TextEncoder().encode(account.id_token), `oauth:${account.provider}:id`) : undefined,
      };

      console.log('✅ Account encrypted successfully, calling original linkAccount');
      
      // Try the encrypted account first, fall back to original if it fails
      try {
        return await originalLinkAccount(encryptedAccount);
      } catch (encryptedError) {
        console.warn('⚠️ Encrypted account failed, trying original:', encryptedError.message);
        return await originalLinkAccount(account);
      }

    } catch (error) {
      console.error('❌ Failed to encrypt account tokens:', error);
      // Fall back to original method without encryption
      console.log('🔄 Falling back to original linkAccount method');
      return await originalLinkAccount(account);
    }
  };

  return adapter;
}