import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import { encryptForOrg } from "./crypto";

// Custom adapter that encrypts OAuth tokens before storing
export function createCustomPrismaAdapter() {
  const adapter = PrismaAdapter(prisma);

  // Override the linkAccount method to encrypt tokens and map to encrypted fields
  adapter.linkAccount = async (account) => {
    console.log('🔗 Linking account with KMS encryption:', {
      provider: account.provider,
      hasAccessToken: !!account.access_token,
      hasRefreshToken: !!account.refresh_token
    });

    try {
      // Get default org for encryption
      const defaultOrg = await prisma.org.findFirst();
      
      if (!defaultOrg) {
        console.error('❌ No organization found for token encryption');
        throw new Error('No organization found for token encryption');
      }

      console.log('🏢 Using org for KMS encryption:', {
        orgId: defaultOrg.id,
        orgName: defaultOrg.name
      });

      // Encrypt OAuth tokens using KMS
      const access_token_enc = account.access_token ? 
        await encryptForOrg(defaultOrg.id, new TextEncoder().encode(account.access_token), `oauth:${account.provider}:access`) : null;
      const refresh_token_enc = account.refresh_token ? 
        await encryptForOrg(defaultOrg.id, new TextEncoder().encode(account.refresh_token), `oauth:${account.provider}:refresh`) : null;
      const id_token_enc = account.id_token ? 
        await encryptForOrg(defaultOrg.id, new TextEncoder().encode(account.id_token), `oauth:${account.provider}:id`) : null;

      console.log('🔒 Tokens encrypted, creating Account record...');

      // Create Account record directly with encrypted fields (bypass NextAuth default mapping)
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

      console.log('✅ Account created with encrypted tokens:', createdAccount.id);
      return createdAccount;

    } catch (error) {
      console.error('❌ Failed to create encrypted account:', error);
      throw error; // Don't fall back to plain text - fail securely
    }
  };

  return adapter;
}