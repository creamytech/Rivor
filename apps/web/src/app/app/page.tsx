import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/signin");
  }

  // Redirect to inbox by default
  redirect("/app/inbox");
}
