"use client";
import { useState, useEffect } from 'react';
import AppShell from "@/components/app/AppShell";
import EnhancedInbox from "@/components/inbox/EnhancedInbox";
import { motion } from 'framer-motion';
import { Mail, Search, Filter, Bookmark } from "lucide-react";

export default function InboxPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        {/* Animated Header */}
        <motion.div 
          className="relative overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-teal-600/20 animate-pulse"></div>
          <div className="relative z-10 px-6 py-8">
            <motion.h1 
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Inbox
            </motion.h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
              Manage your email conversations and leads with intelligent filtering.
            </p>
          </div>
        </motion.div>

        {/* Enhanced Inbox Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 pb-8"
        >
          <EnhancedInbox />
        </motion.div>
      </AppShell>
    </div>
  );
}


