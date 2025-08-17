"use client";
import AppShell from "@/components/app/AppShell";
import PipelineBoard from "@/components/pipeline/PipelineBoard";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, DollarSign } from "lucide-react";

export default function PipelinePage() {
  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <FlowRibbon />
        <AppShell>
          {/* Animated Header */}
          <motion.div 
            className="relative overflow-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20 animate-pulse"></div>
            <div className="relative z-10 px-6 py-8">
              <motion.h1 
                className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                Deal Flow
              </motion.h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                Track and manage your sales pipeline with visual boards and analytics.
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
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Briefcase className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Sales Pipeline
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Visualize and manage your deals across stages
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Active Pipeline
                  </span>
                </div>
              </div>
            </motion.div>
            
            {/* Pipeline Board */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <PipelineBoard className="min-h-[600px]" />
            </motion.div>
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}


