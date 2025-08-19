"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Command, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Enter, 
  Mail, 
  User, 
  Building, 
  Target, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Settings, 
  HelpCircle,
  Sparkles,
  Zap,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Eye,
  Trash2,
  Copy,
  ExternalLink,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'lead' | 'contact' | 'email' | 'task' | 'event' | 'deal' | 'company';
  title: string;
  subtitle?: string;
  description?: string;
  icon: React.ReactNode;
  url: string;
  metadata?: {
    [key: string]: string | number;
  };
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
  status?: string;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  showShortcut?: boolean;
}

export default function GlobalSearch({ 
  className, 
  placeholder = "Search leads, contacts, emails...", 
  showShortcut = true 
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchData = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Search across multiple endpoints
        const searchPromises = [
          fetch(`/api/contacts?search=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => ({ contacts: [] })),
          fetch(`/api/tasks?search=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => ({ tasks: [] })),
          fetch(`/api/calendar/events?search=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => ({ events: [] })),
          fetch(`/api/pipeline/leads?search=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => ({ leads: [] })),
          fetch(`/api/inbox/threads?search=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => ({ threads: [] }))
        ];

        const [contactsData, tasksData, eventsData, leadsData, threadsData] = await Promise.all(searchPromises);

        const allResults: SearchResult[] = [];

        // Add contacts
        (contactsData.contacts || []).forEach((contact: any) => {
          allResults.push({
            id: `contact-${contact.id}`,
            type: 'contact',
            title: contact.name,
            subtitle: contact.company,
            description: contact.email,
            icon: <User className="h-4 w-4" />,
            url: `/app/contacts/${contact.id}`,
            metadata: {
              email: contact.email,
              phone: contact.phone,
              company: contact.company
            },
            tags: contact.tags || []
          });
        });

        // Add tasks
        (tasksData.tasks || []).forEach((task: any) => {
          allResults.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.title,
            subtitle: task.description,
            description: `Due: ${new Date(task.dueDate).toLocaleDateString()}`,
            icon: <CheckSquare className="h-4 w-4" />,
            url: `/app/tasks/${task.id}`,
            metadata: {
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate
            },
            priority: task.priority,
            status: task.status
          });
        });

        // Add calendar events
        (eventsData.events || []).forEach((event: any) => {
          allResults.push({
            id: `event-${event.id}`,
            type: 'event',
            title: event.title,
            subtitle: event.location,
            description: `${new Date(event.start).toLocaleDateString()} at ${new Date(event.start).toLocaleTimeString()}`,
            icon: <Calendar className="h-4 w-4" />,
            url: `/app/calendar/${event.id}`,
            metadata: {
              start: event.start,
              end: event.end,
              location: event.location
            }
          });
        });

        // Add leads
        (leadsData.leads || []).forEach((lead: any) => {
          allResults.push({
            id: `lead-${lead.id}`,
            type: 'lead',
            title: lead.name,
            subtitle: lead.company,
            description: `Value: ${lead.value ? `$${lead.value.toLocaleString()}` : 'N/A'}`,
            icon: <Target className="h-4 w-4" />,
            url: `/app/pipeline/${lead.id}`,
            metadata: {
              value: lead.value,
              stage: lead.stage,
              owner: lead.owner
            },
            tags: lead.tags || [],
            status: lead.stage
          });
        });

        // Add email threads
        (threadsData.threads || []).forEach((thread: any) => {
          allResults.push({
            id: `email-${thread.id}`,
            type: 'email',
            title: thread.subject || 'No Subject',
            subtitle: thread.participants?.[0]?.name || thread.participants?.[0]?.email,
            description: thread.snippet,
            icon: <Mail className="h-4 w-4" />,
            url: `/app/inbox/${thread.id}`,
            metadata: {
              participants: thread.participants?.length || 0,
              messageCount: thread.messageCount,
              lastMessageAt: thread.lastMessageAt
            },
            tags: thread.labels || []
          });
        });

        setResults(allResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the result
    window.location.href = result.url;
    setIsOpen(false);
    setQuery('');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lead':
        return 'bg-blue-100 text-blue-700';
      case 'contact':
        return 'bg-green-100 text-green-700';
      case 'email':
        return 'bg-purple-100 text-purple-700';
      case 'task':
        return 'bg-orange-100 text-orange-700';
      case 'event':
        return 'bg-pink-100 text-pink-700';
      case 'deal':
        return 'bg-emerald-100 text-emerald-700';
      case 'company':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
      case 'closed won':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'pending':
      case 'in progress':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'overdue':
      case 'closed lost':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Search Trigger */}
      <div className={cn("relative", className)}>
        <Button
          variant="outline"
          className="w-full justify-start text-slate-500 dark:text-slate-400"
          onClick={() => setIsOpen(true)}
        >
          <Search className="h-4 w-4 mr-2" />
          {placeholder}
          {showShortcut && (
            <Badge variant="secondary" className="ml-auto text-xs">
              ⌘K
            </Badge>
          )}
        </Button>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    ref={inputRef}
                    placeholder="Search leads, contacts, emails, tasks, events..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Results */}
              <div ref={resultsRef} className="overflow-y-auto max-h-[60vh]">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mx-auto mb-2"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Searching...</p>
                  </div>
                ) : results.length === 0 && query ? (
                  <div className="p-8 text-center">
                    <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">No results found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Try adjusting your search terms
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-8 text-center">
                    <Sparkles className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Start typing to search</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Search across leads, contacts, emails, tasks, and events
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                          selectedIndex === index && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-1">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                              {result.icon}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {result.title}
                              </h3>
                              <Badge variant="secondary" className={cn("text-xs", getTypeColor(result.type))}>
                                {result.type}
                              </Badge>
                              {result.priority && (
                                <Badge variant="secondary" className={cn("text-xs", getPriorityColor(result.priority))}>
                                  {result.priority}
                                </Badge>
                              )}
                              {getStatusIcon(result.status)}
                            </div>

                            {result.subtitle && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                {result.subtitle}
                              </p>
                            )}

                            {result.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-500 line-clamp-2">
                                {result.description}
                              </p>
                            )}

                            {/* Tags */}
                            {result.tags && result.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {result.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {result.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{result.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {results.length > 0 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-4">
                      <span>↑↓ to navigate</span>
                      <span>Enter to select</span>
                      <span>Esc to close</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
