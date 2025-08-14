"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Mail, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  MessageSquare,
  Plus,
  FileText,
  Home,
  Briefcase,
  Phone,
  HelpCircle,
  Zap,
  Bot,
  Star,
  Archive,
  Clock,
  Bell,
  User
} from "lucide-react";

type ActionCategory = "navigation" | "create" | "search" | "ai" | "recent";

type Action = { 
  id: string; 
  title: string; 
  description?: string;
  category: ActionCategory;
  icon?: React.ReactNode;
  shortcut?: string;
  run: () => void;
};

type RecentItem = {
  id: string;
  title: string;
  type: "thread" | "lead" | "contact" | "chat";
  timestamp: Date;
};

type SearchableItem = {
  id: string;
  title: string;
  description?: string;
  type: "thread" | "lead" | "contact" | "chat" | "task" | "event";
  url: string;
  metadata?: Record<string, any>;
};

const mockSearchData: SearchableItem[] = [
  // Email Threads
  {
    id: "thread-1",
    title: "RE: Property Inquiry - 123 Main Street",
    description: "John Smith interested in residential property viewing",
    type: "thread",
    url: "/app/inbox/thread-1",
    metadata: { participants: "John Smith", unread: false, priority: "high" }
  },
  {
    id: "thread-2", 
    title: "Contract Review - ABC Corporation",
    description: "Legal team discussing contract terms and conditions",
    type: "thread",
    url: "/app/inbox/thread-2",
    metadata: { participants: "Mike Williams, Legal Team", unread: true }
  },
  {
    id: "thread-3",
    title: "Follow-up: Marketing Campaign Discussion",
    description: "Emma Davis following up on marketing strategy",
    type: "thread", 
    url: "/app/inbox/thread-3",
    metadata: { participants: "Emma Davis", unread: false }
  },
  
  // Leads
  {
    id: "lead-1",
    title: "John Smith - Residential Property",
    description: "$750,000 deal in New Lead stage",
    type: "lead",
    url: "/app/pipeline/lead-1", 
    metadata: { stage: "New Lead", value: "$750,000", priority: "high" }
  },
  {
    id: "lead-2",
    title: "Sarah Johnson - Commercial Deal", 
    description: "$1,200,000 deal in Qualified stage",
    type: "lead",
    url: "/app/pipeline/lead-2",
    metadata: { stage: "Qualified", value: "$1,200,000", priority: "medium" }
  },
  {
    id: "lead-3",
    title: "Mike Wilson - Industrial Property",
    description: "$950,000 deal in Qualified stage",
    type: "lead", 
    url: "/app/pipeline/lead-3",
    metadata: { stage: "Qualified", value: "$950,000", priority: "high" }
  },

  // Contacts
  {
    id: "contact-1",
    title: "John Smith",
    description: "CEO at Smith Properties, interested in residential",
    type: "contact",
    url: "/app/contacts/contact-1",
    metadata: { company: "Smith Properties", email: "john@smith.com" }
  },
  {
    id: "contact-2", 
    title: "Sarah Johnson",
    description: "VP of Operations at Johnson Corp",
    type: "contact",
    url: "/app/contacts/contact-2", 
    metadata: { company: "Johnson Corp", email: "sarah@johnsoncorp.com" }
  },
  {
    id: "contact-3",
    title: "Mike Wilson",
    description: "Director at Wilson Industries",
    type: "contact",
    url: "/app/contacts/contact-3",
    metadata: { company: "Wilson Industries", email: "mike@wilson.com" }
  },

  // Chat Conversations
  {
    id: "chat-1",
    title: "Follow-up strategy for 123 Main St",
    description: "AI conversation about property follow-up tactics",
    type: "chat",
    url: "/app/chat/chat-1",
    metadata: { messageCount: 8, context: "email" }
  },
  {
    id: "chat-2",
    title: "Lead qualification questions",
    description: "AI assistance with commercial client qualification",
    type: "chat", 
    url: "/app/chat/chat-2",
    metadata: { messageCount: 12, context: "lead" }
  },

  // Tasks
  {
    id: "task-1", 
    title: "Follow up with John Smith",
    description: "Reminder to contact about property viewing", 
    type: "task",
    url: "/app/tasks/task-1",
    metadata: { due: "Today", priority: "high", assignee: "You" }
  },
  {
    id: "task-2",
    title: "Prepare contract for Sarah Johnson",
    description: "Draft commercial property purchase agreement",
    type: "task",
    url: "/app/tasks/task-2", 
    metadata: { due: "Tomorrow", priority: "medium", assignee: "Legal Team" }
  },

  // Calendar Events
  {
    id: "event-1",
    title: "Property Viewing - 123 Main St",
    description: "Show John Smith around the residential property",
    type: "event",
    url: "/app/calendar/event-1",
    metadata: { time: "Saturday 10:00 AM", attendees: "John Smith" }
  },
  {
    id: "event-2", 
    title: "Contract Review Meeting",
    description: "Team meeting to discuss ABC Corporation contract",
    type: "event",
    url: "/app/calendar/event-2",
    metadata: { time: "Monday 2:00 PM", attendees: "Legal Team, Mike Williams" }
  }
];

const mockRecentItems: RecentItem[] = [
  {
    id: "thread-1",
    title: "RE: Property Inquiry - 123 Main Street",
    type: "thread",
    timestamp: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: "lead-2", 
    title: "Sarah Johnson - Commercial Deal",
    type: "lead",
    timestamp: new Date(Date.now() - 1000 * 60 * 60)
  },
  {
    id: "contact-3",
    title: "Mike Wilson - Wilson Industries", 
    type: "contact",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: "chat-1",
    title: "Follow-up strategy discussion",
    type: "chat", 
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4)
  }
];

export default function CommandPalette({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Use props if provided, otherwise use internal state
  const actualOpen = isOpen !== undefined ? isOpen : open;
  const actualSetOpen = setIsOpen || setOpen;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        actualSetOpen(!actualOpen);
      }
      
      if (actualOpen) {
        if (e.key === "Escape") {
          actualSetOpen(false);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          const action = filteredActions[selectedIndex];
          if (action) {
            action.run();
            actualSetOpen(false);
            setQuery("");
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actualOpen, actualSetOpen, selectedIndex]);

  const actions: Action[] = useMemo(() => [
    // Navigation
    { 
      id: "nav-dashboard", 
      title: "Go to Dashboard", 
      description: "Overview of your business",
      category: "navigation",
      icon: <Home className="h-4 w-4" />,
      run: () => router.push("/app") 
    },
    { 
      id: "nav-inbox", 
      title: "Go to Inbox", 
      description: "Manage your email conversations",
      category: "navigation",
      icon: <Mail className="h-4 w-4" />,
      shortcut: "G I",
      run: () => router.push("/app/inbox") 
    },
    { 
      id: "nav-pipeline", 
      title: "Go to Pipeline", 
      description: "Track your sales deals",
      category: "navigation",
      icon: <Briefcase className="h-4 w-4" />,
      shortcut: "G P",
      run: () => router.push("/app/pipeline") 
    },
    { 
      id: "nav-contacts", 
      title: "Go to Contacts", 
      description: "Manage your business relationships",
      category: "navigation",
      icon: <Users className="h-4 w-4" />,
      shortcut: "G C",
      run: () => router.push("/app/contacts") 
    },
    { 
      id: "nav-calendar", 
      title: "Go to Calendar", 
      description: "Schedule and manage meetings",
      category: "navigation",
      icon: <Calendar className="h-4 w-4" />,
      run: () => router.push("/app/calendar") 
    },
    { 
      id: "nav-chat", 
      title: "Go to AI Assistant", 
      description: "Get AI-powered help",
      category: "navigation",
      icon: <MessageSquare className="h-4 w-4" />,
      run: () => router.push("/app/chat") 
    },
    { 
      id: "nav-analytics", 
      title: "Go to Analytics", 
      description: "View performance insights",
      category: "navigation",
      icon: <BarChart3 className="h-4 w-4" />,
      run: () => router.push("/app/analytics") 
    },
    { 
      id: "nav-settings", 
      title: "Go to Settings", 
      description: "Configure your account",
      category: "navigation",
      icon: <Settings className="h-4 w-4" />,
      run: () => router.push("/app/settings") 
    },
    
    // Create actions
    { 
      id: "create-lead", 
      title: "Create New Lead", 
      description: "Add a new prospect to your pipeline",
      category: "create",
      icon: <Plus className="h-4 w-4" />,
      shortcut: "C L",
      run: () => router.push("/app/pipeline?action=new-lead") 
    },
    { 
      id: "create-contact", 
      title: "Create New Contact", 
      description: "Add a new business contact",
      category: "create",
      icon: <User className="h-4 w-4" />,
      shortcut: "C C",
      run: () => router.push("/app/contacts?action=new-contact") 
    },
    { 
      id: "create-task", 
      title: "Create New Task", 
      description: "Add a task or reminder",
      category: "create",
      icon: <FileText className="h-4 w-4" />,
      shortcut: "C T",
      run: () => router.push("/app/tasks?action=new-task") 
    },
    { 
      id: "create-meeting", 
      title: "Schedule Meeting", 
      description: "Create a new calendar event",
      category: "create",
      icon: <Calendar className="h-4 w-4" />,
      shortcut: "C M",
      run: () => router.push("/app/calendar?action=new-event") 
    },
    
    // Search actions
    { 
      id: "search-emails", 
      title: "Search Emails", 
      description: "Find specific email conversations",
      category: "search",
      icon: <Search className="h-4 w-4" />,
      run: () => router.push("/app/inbox?focus=search") 
    },
    { 
      id: "search-leads", 
      title: "Search Leads", 
      description: "Find deals in your pipeline",
      category: "search",
      icon: <Search className="h-4 w-4" />,
      run: () => router.push("/app/pipeline?focus=search") 
    },
    { 
      id: "search-contacts", 
      title: "Search Contacts", 
      description: "Find business contacts",
      category: "search",
      icon: <Search className="h-4 w-4" />,
      run: () => router.push("/app/contacts?focus=search") 
    },
    
    // AI Actions
    { 
      id: "ai-draft", 
      title: "Draft Email", 
      description: "Get AI help writing an email",
      category: "ai",
      icon: <Bot className="h-4 w-4" />,
      run: () => router.push("/app/chat?action=draft-email") 
    },
    { 
      id: "ai-summarize", 
      title: "Summarize Thread", 
      description: "Get AI summary of current conversation",
      category: "ai",
      icon: <Bot className="h-4 w-4" />,
      run: () => router.push("/app/chat?action=summarize") 
    },
    { 
      id: "ai-strategy", 
      title: "Get Sales Strategy", 
      description: "Ask AI for lead qualification tips",
      category: "ai",
      icon: <Zap className="h-4 w-4" />,
      run: () => router.push("/app/chat?action=strategy") 
    }
  ], [router]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) {
      // Show recent items when no query
      const recentActions = mockRecentItems.map(item => ({
        id: `recent-${item.id}`,
        title: item.title,
        description: `${item.type} • ${item.timestamp.toLocaleDateString()}`,
        category: "recent" as ActionCategory,
        icon: getIconForType(item.type),
        run: () => {
          const basePath = {
            thread: "/app/inbox",
            lead: "/app/pipeline", 
            contact: "/app/contacts",
            chat: "/app/chat"
          }[item.type];
          router.push(`${basePath}/${item.id}`);
        }
      }));
      
      return [...recentActions, ...actions.slice(0, 8)];
    }
    
    // Search in both commands and data
    const queryLower = query.toLowerCase();
    
    // Filter commands
    const commandResults = actions.filter(action => 
      action.title.toLowerCase().includes(queryLower) ||
      action.description?.toLowerCase().includes(queryLower)
    );
    
    // Search in data items
    const searchResults = mockSearchData
      .filter(item => 
        item.title.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower) ||
        Object.values(item.metadata || {}).some(value => 
          String(value).toLowerCase().includes(queryLower)
        )
      )
      .map(item => ({
        id: `search-${item.id}`,
        title: item.title,
        description: item.description || `${item.type} • ${item.metadata?.stage || ''}`,
        category: "search" as ActionCategory,
        icon: getIconForDataType(item.type),
        run: () => router.push(item.url)
      }));
    
    return [...searchResults, ...commandResults];
  }, [query, actions, router]);

  function getIconForType(type: string) {
    switch (type) {
      case "thread": return <Mail className="h-4 w-4" />;
      case "lead": return <Briefcase className="h-4 w-4" />;
      case "contact": return <User className="h-4 w-4" />;
      case "chat": return <MessageSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  }

  function getIconForDataType(type: string) {
    switch (type) {
      case "thread": return <Mail className="h-4 w-4" />;
      case "lead": return <Briefcase className="h-4 w-4" />;
      case "contact": return <User className="h-4 w-4" />;
      case "chat": return <MessageSquare className="h-4 w-4" />;
      case "task": return <FileText className="h-4 w-4" />;
      case "event": return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  }

  const groupedActions = useMemo(() => {
    const groups: Record<string, Action[]> = {};
    filteredActions.forEach(action => {
      if (!groups[action.category]) groups[action.category] = [];
      groups[action.category].push(action);
    });
    return groups;
  }, [filteredActions]);

  const getCategoryTitle = (category: ActionCategory) => {
    switch (category) {
      case "navigation": return "Navigate";
      case "create": return "Create";
      case "search": return "Search";
      case "ai": return "AI Assistant";
      case "recent": return "Recent";
      default: return "";
    }
  };

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!actualOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm grid place-items-start p-4">
      <div className="w-full max-w-2xl mx-auto mt-[10vh]">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg">
          <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
            <Search className="h-5 w-5 text-[var(--muted-foreground)]" />
            <input 
              autoFocus 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Type a command or search..." 
              className="flex-1 bg-transparent text-base placeholder:text-[var(--muted-foreground)] focus:outline-none"
            />
            <div className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
              ⌘K
            </div>
          </div>
          
          <div className="max-h-[50vh] overflow-auto">
            {filteredActions.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-sm text-[var(--muted-foreground)]">No results found</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">
                  Try searching for emails, contacts, or commands
                </div>
              </div>
            )}
            
            {Object.entries(groupedActions).map(([category, categoryActions]) => (
              <div key={category}>
                {categoryActions.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] bg-[var(--muted)] border-b border-[var(--border)]">
                      {getCategoryTitle(category as ActionCategory)}
                    </div>
                    {categoryActions.map((action, actionIndex) => {
                      const globalIndex = filteredActions.indexOf(action);
                      return (
                        <button 
                          key={action.id} 
                          onClick={() => { 
                            action.run(); 
                            actualSetOpen(false); 
                            setQuery(""); 
                          }} 
                          className={`w-full text-left px-4 py-3 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] last:border-b-0 ${
                            globalIndex === selectedIndex ? "bg-[var(--muted)]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-[var(--muted-foreground)]">
                              {action.icon}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{action.title}</div>
                              {action.description && (
                                <div className="text-xs text-[var(--muted-foreground)] mt-1">
                                  {action.description}
                                </div>
                              )}
                            </div>
                            {action.shortcut && (
                              <div className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
                                {action.shortcut}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            ))}
          </div>
          
          <div className="px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="bg-[var(--muted)] px-1 py-0.5 rounded">↑↓</kbd> to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-[var(--muted)] px-1 py-0.5 rounded">Enter</kbd> to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-[var(--muted)] px-1 py-0.5 rounded">Esc</kbd> to close
              </span>
            </div>
            <div>
              {filteredActions.length} results
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


