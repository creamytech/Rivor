import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Inbox, Users, Calendar, Briefcase } from "lucide-react";

export function Loading({ lines = 5, className }: { lines?: number; className?: string }) {
  return (
    <div className={`p-6 space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function Empty({ 
  title, 
  description, 
  cta, 
  icon: Icon = Inbox 
}: { 
  title: string; 
  description?: string;
  cta?: React.ReactNode; 
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-[var(--muted-foreground)]" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {cta}
    </div>
  );
}

export function ErrorState({ 
  title, 
  description,
  action 
}: { 
  title: string; 
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-red-900 dark:text-red-100 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-red-700 dark:text-red-200 mb-3">
              {description}
            </p>
          )}
          {action}
        </div>
      </div>
    </div>
  );
}

// Specific empty states for different pages
export function InboxEmpty() {
  return (
    <Empty
      icon={Inbox}
      title="No messages yet"
      description="Once you connect your email account, your messages will appear here."
      cta={
        <Button variant="brand" asChild>
          <a href="/app/settings?tab=integrations">Connect Email</a>
        </Button>
      }
    />
  );
}

export function PipelineEmpty() {
  return (
    <Empty
      icon={Briefcase}
      title="No deals in your pipeline"
      description="Start by adding your first lead or importing existing contacts."
      cta={
        <div className="flex gap-2 justify-center">
          <Button variant="brand">Add Lead</Button>
          <Button variant="outline">Import Contacts</Button>
        </div>
      }
    />
  );
}

export function ContactsEmpty() {
  return (
    <Empty
      icon={Users}
      title="No contacts yet"
      description="Add contacts manually or sync them from your email account."
      cta={
        <div className="flex gap-2 justify-center">
          <Button variant="brand">Add Contact</Button>
          <Button variant="outline">Sync from Email</Button>
        </div>
      }
    />
  );
}

export function CalendarEmpty() {
  return (
    <Empty
      icon={Calendar}
      title="No events scheduled"
      description="Connect your calendar to see your upcoming events and schedule new meetings."
      cta={
        <Button variant="brand" asChild>
          <a href="/app/settings?tab=integrations">Connect Calendar</a>
        </Button>
      }
    />
  );
}


