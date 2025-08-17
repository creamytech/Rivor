import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  // Redirect unauthenticated users to signin
  if (!session) {
    redirect("/auth/signin");
  }
  
  return <>{children}</>;
}


