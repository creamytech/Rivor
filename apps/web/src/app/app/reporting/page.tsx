"use client";

import { motion } from 'framer-motion';
import dynamic from "next/dynamic";
import { useTheme } from '@/contexts/ThemeContext';
import AppShell from '@/components/app/AppShell';
import EnhancedReporting from '@/components/reporting/EnhancedReporting';


export default function ReportingPage() {
  const { theme } = useTheme();
  
  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        <div 
          className="min-h-screen glass-theme-gradient"
          style={{
            background: 'var(--glass-gradient)'
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
    </div>
  );
}