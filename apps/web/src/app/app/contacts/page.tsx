"use client";
import { useState } from "react";
import AppShell from "@/components/app/AppShell";
import ContactsList from "@/components/contacts/ContactsList";
import ContactDetail from "@/components/contacts/ContactDetail";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import type { Contact } from "@/components/contacts/ContactsList";
import { motion } from 'framer-motion';
import { Users, User, ArrowLeft } from "lucide-react";

export default function ContactsPage() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const handleContactClick = (contact: Contact) => {
    setSelectedContactId(contact.id);
  };

  const handleBackToList = () => {
    setSelectedContactId(null);
  };

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <FlowRibbon />
        <AppShell>
          {/* Animated Header */}
          <motion.div 
            className="relative overflow-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-amber-600/20 to-yellow-600/20 animate-pulse"></div>
            <div className="relative z-10 px-6 py-8">
              <motion.h1 
                className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                Contact Flow
              </motion.h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                Manage your contacts and relationships with smart organization.
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
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Contact Management
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Browse and manage your contact relationships
                  </p>
                </div>
              </div>
              
              {selectedContactId && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={handleBackToList}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to List
                </motion.button>
              )}
            </motion.div>
            
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {selectedContactId ? (
                <ContactDetail
                  contactId={selectedContactId}
                  onBack={handleBackToList}
                  className="min-h-[600px]"
                />
              ) : (
                <ContactsList
                  onContactClick={handleContactClick}
                  className="min-h-[600px]"
                />
              )}
            </motion.div>
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}
