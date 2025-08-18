"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedSettings from "@/components/settings/EnhancedSettings";
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <AppShell>
        {/* Animated Header */}
        <motion.div 
          className="relative overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 via-gray-600/20 to-zinc-600/20 animate-pulse"></div>
          <div className="relative z-10 px-6 py-8">
            <motion.h1 
              className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Settings
            </motion.h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
              Manage your account, lead rules, integrations, and preferences.
            </p>
          </div>
        </motion.div>

        {/* Enhanced Settings Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 pb-8"
        >
          <EnhancedSettings />
        </motion.div>
      </AppShell>
    </div>
  );
}