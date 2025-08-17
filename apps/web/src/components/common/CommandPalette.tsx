"use client";
import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, Mail, Users, Briefcase, Calendar, MessageSquare, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'thread' | 'contact' | 'deal' | 'action';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onClose]);

  useEffect(() => {
    if (!search) {
      setResults(getDefaultActions());
      return;
    }

    // Simulate search results
    const searchResults: SearchResult[] = [
      {
        id: '1',
        type: 'thread',
        title: 'Property inquiry from John Smith',
        subtitle: 'john.smith@email.com • 2 hours ago',
        icon: <Mail className="h-4 w-4" />,
        action: () => window.location.href = '/app/inbox/1'
      },
      {
        id: '2',
        type: 'contact',
        title: 'John Smith',
        subtitle: 'john.smith@email.com • 3 leads',
        icon: <Users className="h-4 w-4" />,
        action: () => window.location.href = '/app/contacts/1'
      },
      {
        id: '3',
        type: 'deal',
        title: '123 Main St - Buyer Lead',
        subtitle: 'Qualified • $450k budget',
        icon: <Briefcase className="h-4 w-4" />,
        action: () => window.location.href = '/app/pipeline/1'
      }
    ];

    setResults(searchResults);
  }, [search]);

  const getDefaultActions = (): SearchResult[] => [
    {
      id: 'compose',
      type: 'action',
      title: 'Compose Email',
      subtitle: 'Write a new email',
      icon: <Mail className="h-4 w-4" />,
      action: () => window.location.href = '/app/inbox?compose=true'
    },
    {
      id: 'add-deal',
      type: 'action',
      title: 'Add Deal',
      subtitle: 'Create a new lead',
      icon: <Plus className="h-4 w-4" />,
      action: () => window.location.href = '/app/pipeline?add=true'
    },
    {
      id: 'schedule',
      type: 'action',
      title: 'Schedule Meeting',
      subtitle: 'Book a calendar event',
      icon: <Calendar className="h-4 w-4" />,
      action: () => window.location.href = '/app/calendar?add=true'
    },
    {
      id: 'ask-ai',
      type: 'action',
      title: 'Ask AI Assistant',
      subtitle: 'Get help with tasks',
      icon: <MessageSquare className="h-4 w-4" />,
      action: () => window.location.href = '/app/chat'
    },
    {
      id: 'settings',
      type: 'action',
      title: 'Settings',
      subtitle: 'Configure your account',
      icon: <Settings className="h-4 w-4" />,
      action: () => window.location.href = '/app/settings'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh] px-4">
        <GlassCard 
          className="w-full max-w-2xl max-h-[60vh] overflow-hidden"
          variant="gradient"
          intensity="medium"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCardContent className="p-0">
            <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
              <div className="flex items-center border-b border-white/20 px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search threads, contacts, deals, or run actions..."
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                <div className="p-2">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={result.action}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-slate-900 dark:hover:text-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full"
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        {result.icon}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-slate-500">{result.subtitle}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Command>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}


