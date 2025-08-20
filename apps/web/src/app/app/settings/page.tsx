"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedSettings from "@/components/settings/EnhancedSettings";
import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <AppShell>
        {/* Enhanced Settings Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 md:px-6 pb-8"
        >
          <EnhancedSettings />
        </motion.div>
      </AppShell>
    </div>
  );
}