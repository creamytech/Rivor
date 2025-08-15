import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import AdminHealthDashboard from '@/components/admin/AdminHealthDashboard';

export default async function AdminHealthPage() {
  const session = await auth();
  
  // TODO: Add proper admin role check here
  // For now, require authentication
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            System Health
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Monitor system status, integrations, and performance
          </p>
        </div>
        
        <AdminHealthDashboard />
      </div>
    </div>
  );
}
