import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import OnboardingManager from "@/components/onboarding/OnboardingManager";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Skip auth check in development for localhost
  if (process.env.NODE_ENV === 'development') {
    return (
      <OnboardingManager>
        {children}
      </OnboardingManager>
    );
  }
  
  const session = await auth();
  
  // Redirect unauthenticated users to signin in production
  if (!session) {
    redirect("/auth/signin");
  }
  
  return (
    <OnboardingManager>
      {children}
    </OnboardingManager>
  );
}


