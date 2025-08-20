"use client";

import { motion } from 'framer-motion';
import dynamic from "next/dynamic";
import EnhancedReporting from '@/components/reporting/EnhancedReporting';

const AppShell = dynamic(() => import("@/components/app/AppShell"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function ReportingPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <EnhancedReporting />
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}