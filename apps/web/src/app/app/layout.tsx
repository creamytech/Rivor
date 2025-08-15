import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { checkTokenHealth } from "@/server/oauth";
import TokenHealthBanner from "@/components/app/TokenHealthBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  // Redirect unauthenticated users to signin
  if (!session) {
    redirect("/auth/signin");
  }

  // Check token health for authenticated users
  const userEmail = session.user?.email;
  let expiredProviders: string[] = [];
  let missingProviders: string[] = [];
  
  if (userEmail) {
    try {
      const tokenHealth = await checkTokenHealth(userEmail);
      expiredProviders = tokenHealth.filter(t => t.expired).map(t => t.provider);
      
      // Check for missing providers (Google and Microsoft are required)
      const connectedProviders = tokenHealth.map(t => t.provider);
      const requiredProviders = ['google', 'azure-ad'];
      missingProviders = requiredProviders.filter(p => !connectedProviders.includes(p));
    } catch (error) {
      console.error('Error checking token health:', error);
    }
  }
  
  return (
    <>
      <TokenHealthBanner 
        expiredProviders={expiredProviders}
        missingProviders={missingProviders}
      />
      {children}
    </>
  );
}


