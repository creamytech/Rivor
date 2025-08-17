import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import dynamic from "next/dynamic";

// Dynamically import client components with no SSR
const ClientDashboard = dynamic(() => import("@/components/app/ClientDashboard"), { 
  ssr: false,
  loading: () => (
    <div className="container py-6 space-y-8">
      <div className="text-center text-slate-600 dark:text-slate-400">
        Loading dashboard...
      </div>
    </div>
  )
});

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/signin");
  }

  return <ClientDashboard />;
}
