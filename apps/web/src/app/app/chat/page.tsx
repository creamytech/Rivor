"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedChat from "@/components/chat/EnhancedChat";
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Bot } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        {/* Animated Header */}
        <motion.div 
          className="relative overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 via-cyan-600/20 to-blue-600/20 animate-pulse"></div>
          <div className="relative z-10 px-6 py-8">
            <motion.h1 
              className="text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              AI Assistant
            </motion.h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
              Get help with emails, leads, calendar events, and tasks using AI-powered tools.
            </p>
          </div>
        </motion.div>

        {/* Enhanced Chat Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 pb-8"
        >
          <EnhancedChat />
        </motion.div>
      </AppShell>
    </div>
  );
}
