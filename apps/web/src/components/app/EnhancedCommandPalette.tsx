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

export default function EnhancedCommandPalette({ 
  isOpen, 
  setIsOpen 
}: { 
  isOpen?: boolean; 
  setIsOpen?: (open: boolean) => void 
}) {
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
      run: () => router.push("/app/pipeline?action=create") 
    },
    { 
      id: "create-contact", 
      title: "Create New Contact", 
      description: "Add a new business contact",
      category: "create",
      icon: <User className="h-4 w-4" />,
      shortcut: "C C",
      run: () => router.push("/app/contacts?action=create") 
    },
    { 
      id: "create-task", 
      title: "Create New Task", 
      description: "Add a task or reminder",
      category: "create",
      icon: <FileText className="h-4 w-4" />,
      shortcut: "C T",
      run: () => router.push("/app/tasks?action=create") 
    },
    { 
      id: "create-meeting", 
      title: "Schedule Meeting", 
      description: "Create a new calendar event",
      category: "create",
      icon: <Calendar className="h-4 w-4" />,
      shortcut: "C M",
      run: () => router.push("/app/calendar?action=create") 
    },
    
    // Search actions
    { 
      id: "search-emails", 
      title: "Search Emails", 
      description: "Find specific email conversations",
      category: "search",
      icon: <Search className="h-4 w-4" />,
      run: () => router.push("/app/search?type=email") 
    },
    { 
      id: "search-leads", 
      title: "Search Leads", 
      description: "Find deals in your pipeline",
      category: "search",
      icon: <Search className="h-4 w-4" />,
      run: () => router.push("/app/search?type=leads") 
    },
    { 
      id: "search-contacts", 
      title: "Search Contacts", 
      description: "Find business contacts",
      category: "search",
      icon: <Search className="h-4 w-4" />,
      run: () => router.push("/app/search?type=contacts") 
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
      // Show navigation and create actions when no query
      return actions.filter(action => 
        action.category === "navigation" || action.category === "create"
      );
    }
    
    // Filter by query
    const queryLower = query.toLowerCase();
    return actions.filter(action => 
      action.title.toLowerCase().includes(queryLower) ||
      action.description?.toLowerCase().includes(queryLower)
    );
  }, [query, actions]);

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
              aria-label="Command palette search"
              aria-describedby="command-palette-instructions"
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
                  Try searching for navigation, actions, or commands
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
            <div id="command-palette-instructions" className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="bg-[var(--muted)] px-1 py-0.5 rounded" aria-label="Arrow keys">↑↓</kbd> to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-[var(--muted)] px-1 py-0.5 rounded" aria-label="Enter key">Enter</kbd> to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-[var(--muted)] px-1 py-0.5 rounded" aria-label="Escape key">Esc</kbd> to close
              </span>
            </div>
            <div role="status" aria-live="polite">
              {filteredActions.length} result{filteredActions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
