"use client";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Not Authenticated
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Welcome, {session.user?.name || session.user?.email?.split('@')[0] || 'there'}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            This is a minimal dashboard page to test functionality.
          </p>
          <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Session Info
            </h2>
            <div className="text-left space-y-2 text-sm">
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>Name:</strong> {session.user?.name || 'Not provided'}</p>
              <p><strong>Status:</strong> {status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
