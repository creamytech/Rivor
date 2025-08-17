"use client";
import AppShell from "@/components/app/AppShell";
import ThreadList from "@/components/inbox/ThreadList";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import SyncButton from "@/components/common/SyncButton";
import ComposeEmailModal from "@/components/inbox/ComposeEmailModal";
import { motion } from 'framer-motion';
import { Mail, Plus, RefreshCw } from "lucide-react";

export default function InboxPage() {
  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <FlowRibbon />
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
                Email Stream
              </motion.h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                Manage your email conversations with fast search and actions.
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
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Inbox Management
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Compose, sync, and organize your emails
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <ComposeEmailModal 
                  onEmailSent={(result) => {
                    console.log('Email sent:', result);
                    window.location.reload();
                  }}
                />
                <SyncButton 
                  type="email" 
                  variant="outline"
                  size="sm"
                  onSyncComplete={(result) => {
                    console.log('Email sync completed:', result);
                    window.location.reload();
                  }}
                />
              </div>
            </motion.div>
            
            {/* Thread List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ThreadList className="min-h-[600px]" />
            </motion.div>
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}


