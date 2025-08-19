"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Command as CommandIcon, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Enter,
  Mail,
  User,
  Briefcase,
  Calendar,
  CheckSquare,
  Settings,
  Plus,
  FileText,
  Star,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Building,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'lead' | 'deal' | 'contact' | 'email' | 'task' | 'action';
  title: string;
  subtitle?: string;
  description?: string;
  icon: React.ReactNode;
  avatar?: string;
  badge?: string;
  badgeColor?: string;
  action: () => void;
  keywords: string[];
  priority: number;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
}

export default function GlobalSearch({ 
  className, 
  placeholder = "Search leads, deals, contacts, emails...",
  onResultSelect 
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock search results - in real app, this would come from API
  const mockResults: SearchResult[] = [
    // Leads
    {
      id: 'lead-1',
      type: 'lead',
      title: 'Sarah Johnson',
      subtitle: 'TechCorp Inc.',
      description: 'VP of Engineering - High priority lead from website',
      icon: <User className="h-4 w-4" />,
      avatar: '/api/avatar/sarah-johnson',
      badge: 'Hot',
      badgeColor: 'red',
      action: () => console.log('Open lead: Sarah Johnson'),
      keywords: ['sarah', 'johnson', 'techcorp', 'engineering', 'vp'],
      priority: 10
    },
    {
      id: 'lead-2',
      type: 'lead',
      title: 'Mike Chen',
      subtitle: 'StartupXYZ',
      description: 'Founder - Interested in enterprise plan',
      icon: <User className="h-4 w-4" />,
      avatar: '/api/avatar/mike-chen',
      badge: 'New',
      badgeColor: 'blue',
      action: () => console.log('Open lead: Mike Chen'),
      keywords: ['mike', 'chen', 'startupxyz', 'founder', 'enterprise'],
      priority: 8
    },
    // Deals
    {
      id: 'deal-1',
      type: 'deal',
      title: 'Enterprise Contract',
      subtitle: 'TechCorp Inc.',
      description: '$250K - 75% probability - Closing this month',
      icon: <Briefcase className="h-4 w-4" />,
      badge: '$250K',
      badgeColor: 'green',
      action: () => console.log('Open deal: Enterprise Contract'),
      keywords: ['enterprise', 'contract', 'techcorp', '250k', 'closing'],
      priority: 9
    },
    // Contacts
    {
      id: 'contact-1',
      type: 'contact',
      title: 'David Wilson',
      subtitle: 'david@techcorp.com',
      description: 'CTO at TechCorp - Last contact: 2 days ago',
      icon: <User className="h-4 w-4" />,
      avatar: '/api/avatar/david-wilson',
      action: () => console.log('Open contact: David Wilson'),
      keywords: ['david', 'wilson', 'cto', 'techcorp', 'email'],
      priority: 7
    },
    // Emails
    {
      id: 'email-1',
      type: 'email',
      title: 'Re: Proposal Discussion',
      subtitle: 'From: sarah@techcorp.com',
      description: 'Latest email in thread - 3 hours ago',
      icon: <Mail className="h-4 w-4" />,
      badge: 'Unread',
      badgeColor: 'blue',
      action: () => console.log('Open email: Proposal Discussion'),
      keywords: ['proposal', 'discussion', 'sarah', 'techcorp', 'email'],
      priority: 6
    },
    // Tasks
    {
      id: 'task-1',
      type: 'task',
      title: 'Follow up with TechCorp',
      subtitle: 'Due: Today',
      description: 'Call Sarah to discuss proposal feedback',
      icon: <CheckSquare className="h-4 w-4" />,
      badge: 'Due Today',
      badgeColor: 'orange',
      action: () => console.log('Open task: Follow up with TechCorp'),
      keywords: ['follow', 'up', 'techcorp', 'sarah', 'call', 'proposal'],
      priority: 5
    },
    // Quick Actions
    {
      id: 'action-add-lead',
      type: 'action',
      title: 'Add New Lead',
      subtitle: 'Create a new lead record',
      description: 'Quickly add a new lead to your pipeline',
      icon: <Plus className="h-4 w-4" />,
      action: () => console.log('Add new lead'),
      keywords: ['add', 'new', 'lead', 'create', 'pipeline'],
      priority: 4
    },
    {
      id: 'action-schedule-meeting',
      type: 'action',
      title: 'Schedule Meeting',
      subtitle: 'Book a meeting with contacts',
      description: 'Schedule a meeting or call',
      icon: <Calendar className="h-4 w-4" />,
      action: () => console.log('Schedule meeting'),
      keywords: ['schedule', 'meeting', 'book', 'call', 'calendar'],
      priority: 4
    },
    {
      id: 'action-compose-email',
      type: 'action',
      title: 'Compose Email',
      subtitle: 'Write a new email',
      description: 'Start composing a new email message',
      icon: <Mail className="h-4 w-4" />,
      action: () => console.log('Compose email'),
      keywords: ['compose', 'email', 'write', 'new', 'message'],
      priority: 4
    }
  ];

  // Filter results based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(mockResults.slice(0, 8));
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = mockResults
      .filter(result => 
        result.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
        result.title.toLowerCase().includes(query) ||
        result.subtitle?.toLowerCase().includes(query) ||
        result.description?.toLowerCase().includes(query)
      )
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);

    setResults(filtered);
    setSelectedIndex(0);
  }, [searchQuery]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
          setIsOpen(false);
          setSearchQuery('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'deal':
        return <Briefcase className="h-4 w-4 text-green-500" />;
      case 'contact':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-orange-500" />;
      case 'task':
        return <CheckSquare className="h-4 w-4 text-red-500" />;
      case 'action':
        return <Plus className="h-4 w-4 text-slate-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lead':
        return 'Lead';
      case 'deal':
        return 'Deal';
      case 'contact':
        return 'Contact';
      case 'email':
        return 'Email';
      case 'task':
        return 'Task';
      case 'action':
        return 'Action';
      default:
        return 'Item';
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Search Trigger */}
      <Button
        variant="outline"
        className="w-full justify-start text-slate-500 dark:text-slate-400"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        {placeholder}
        <div className="ml-auto flex items-center gap-1">
          <CommandIcon className="h-3 w-3" />
          <span className="text-xs">K</span>
        </div>
      </Button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700">
                {/* Search Input */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      ref={inputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search leads, deals, contacts, emails..."
                      className="pl-10 pr-10"
                      autoFocus
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                  {results.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No results found</p>
                      <p className="text-sm">Try searching for leads, deals, contacts, or emails</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {results.map((result, index) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <button
                            onClick={() => {
                              result.action();
                              setIsOpen(false);
                              setSearchQuery('');
                            }}
                            className={cn(
                              "w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                              selectedIndex === index && "bg-slate-100 dark:bg-slate-800"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar/Icon */}
                              <div className="flex-shrink-0 mt-1">
                                {result.avatar ? (
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={result.avatar} />
                                    <AvatarFallback>
                                      {result.title.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    {getTypeIcon(result.type)}
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {result.title}
                                  </span>
                                  {result.badge && (
                                    <Badge 
                                      variant="secondary" 
                                      className={cn("text-xs", result.badgeColor && `bg-${result.badgeColor}-100 text-${result.badgeColor}-700 dark:bg-${result.badgeColor}-900/20 dark:text-${result.badgeColor}-400`)}
                                    >
                                      {result.badge}
                                    </Badge>
                                  )}
                                </div>
                                
                                {result.subtitle && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    {result.subtitle}
                                  </p>
                                )}
                                
                                {result.description && (
                                  <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                              </div>

                              {/* Type Label */}
                              <div className="flex-shrink-0">
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(result.type)}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        <ArrowDown className="h-3 w-3" />
                        Navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <Enter className="h-3 w-3" />
                        Select
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <CommandIcon className="h-3 w-3" />
                      <span>⌘K</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
