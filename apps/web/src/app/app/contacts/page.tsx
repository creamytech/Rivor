"use client";
import { useState } from "react";
import AppShell from "@/components/app/AppShell";
import ContactsList from "@/components/contacts/ContactsList";
import ContactDetail from "@/components/contacts/ContactDetail";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import type { Contact } from "@/components/contacts/ContactsList";

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
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <FlowRibbon />
        <AppShell>
          <div className="container py-6 space-y-6">
            <TokenErrorBanner />
            
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
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}
