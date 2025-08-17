"use client";
import AppShell from "@/components/app/AppShell";
import ChatInterface from "@/components/chat/ChatInterface";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Bot } from "lucide-react";

export default function ChatPage() {
  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <FlowRibbon />
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

          <div className="px-6 pb-8 space-y-6">
            {/* Token Health Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TokenErrorBanner />
            </motion.div>
            
            {/* Action Bar */}
            <motion.div 
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <Bot className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    AI Assistant
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Intelligent help for your workflow tasks
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                    AI Powered
                  </span>
                </div>
              </div>
            </motion.div>
            
            {/* Chat Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ChatInterface className="min-h-[600px]" />
            </motion.div>
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}
