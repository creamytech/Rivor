import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import TokenHealthBanner from "@/components/app/TokenHealthBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  // Redirect unauthenticated users to signin
  if (!session) {
    redirect("/auth/signin");
  }
  
  return (
    <>
      <TokenHealthBanner />
      {children}
    </>
  );
}


