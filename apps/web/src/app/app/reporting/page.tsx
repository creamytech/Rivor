"use client";

import { motion } from 'framer-motion';
import dynamic from "next/dynamic";
import { useTheme } from '@/contexts/ThemeContext';
import EnhancedReporting from '@/components/reporting/EnhancedReporting';

const AppShell = dynamic(() => import("@/components/app/AppShell"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current opacity-25"></div>
    </div>
  )
});

export default function ReportingPage() {
  const { currentTheme } = useTheme();
  
  return (
    <AppShell>
      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, ${currentTheme.colors.backgroundSecondary} 100%)`
        }}
      >
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