"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Lightbulb,
  BookOpen,
  Zap,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

interface ChatAgentProps {
  isOpen: boolean;
  onClose: () => void;
}

// Knowledge base for the chat agent
const KNOWLEDGE_BASE = {
  dashboard: {
    title: "Dashboard Overview",
    content: "The dashboard is your command center. You can customize it by clicking the 'Customize' button to rearrange cards, add new ones, or change layouts. Each card shows different insights about your leads, pipeline, and system health.",
    tips: [
      "Drag cards to rearrange them in edit mode",
      "Click the gear icon on cards for quick actions",
      "Use the search bar to find specific information"
    ]
  },
  inbox: {
    title: "Inbox Management",
    content: "Your inbox automatically detects leads from emails and organizes them. You can compose new emails, set up auto-responses, and track email engagement.",
    tips: [
      "Set up email integrations to automatically detect leads",
      "Use AI to draft follow-up emails",
      "Create email templates for common responses"
    ]
  },
  pipeline: {
    title: "Pipeline Management",
    content: "The pipeline helps you track leads through your sales process. Create stages, move leads between them, and analyze conversion rates.",
    tips: [
      "Create custom stages that match your sales process",
      "Use the pipeline view to see all leads at once",
      "Set up automated actions when leads move stages"
    ]
  },
  calendar: {
    title: "Calendar Integration",
    content: "Connect your calendar to automatically detect meetings and create leads from attendees. Schedule follow-ups and track meeting outcomes.",
    tips: [
      "Connect Google Calendar or Outlook",
      "Set up meeting templates",
      "Automatically create leads from meeting attendees"
    ]
  },
  contacts: {
    title: "Contact Management",
    content: "Manage all your contacts in one place. Import contacts, track interactions, and maintain detailed profiles.",
    tips: [
      "Import contacts from CSV or other CRM systems",
      "Add custom fields to track important information",
      "Use tags to organize contacts"
    ]
  },
  chat: {
    title: "AI Chat Assistant",
    content: "The AI chat helps you draft emails, analyze leads, and get insights about your sales process.",
    tips: [
      "Ask the AI to draft follow-up emails",
      "Get suggestions for lead qualification",
      "Request analysis of your pipeline performance"
    ]
  }
};

export default function ChatAgent({ isOpen, onClose }: ChatAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your Rivor assistant. I can help you navigate the platform, explain features, and provide tips. What would you like to know about?",
      timestamp: new Date(),
      suggestions: ['Dashboard', 'Inbox', 'Pipeline', 'Calendar', 'Contacts', 'Chat']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'customize-dashboard',
      title: 'Customize Dashboard',
      description: 'Learn how to arrange and configure your dashboard',
      icon: <Sparkles className="h-4 w-4" />,
      action: () => handleQuickAction('customize-dashboard')
    },
    {
      id: 'setup-integrations',
      title: 'Setup Integrations',
      description: 'Connect your email and calendar accounts',
      icon: <Zap className="h-4 w-4" />,
      action: () => handleQuickAction('setup-integrations')
    },
    {
      id: 'create-pipeline',
      title: 'Create Pipeline',
      description: 'Set up your sales pipeline stages',
      icon: <BookOpen className="h-4 w-4" />,
      action: () => handleQuickAction('create-pipeline')
    },
    {
      id: 'ai-features',
      title: 'AI Features',
      description: 'Discover how AI can help your sales process',
      icon: <Lightbulb className="h-4 w-4" />,
      action: () => handleQuickAction('ai-features')
    }
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(inputValue);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickAction = (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (!action) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: action.title,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(action.title);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800);
  };

  const generateResponse = (query: string): { content: string; suggestions?: string[] } => {
    const lowerQuery = query.toLowerCase();
    
    // Check knowledge base
    for (const [key, info] of Object.entries(KNOWLEDGE_BASE)) {
      if (lowerQuery.includes(key) || info.title.toLowerCase().includes(lowerQuery)) {
        return {
          content: `${info.title}\n\n${info.content}\n\n💡 **Quick Tips:**\n${info.tips.map(tip => `• ${tip}`).join('\n')}`,
          suggestions: ['Dashboard', 'Inbox', 'Pipeline', 'Calendar', 'Contacts', 'Chat']
        };
      }
    }

    // Handle specific queries
    if (lowerQuery.includes('customize') || lowerQuery.includes('dashboard')) {
      return {
        content: "To customize your dashboard:\n\n1. Click the 'Customize' button (bottom right)\n2. Drag cards to rearrange them\n3. Use the 'Add Cards' button to add new widgets\n4. Choose from different layout presets\n5. Click 'Save & Exit' when done",
        suggestions: ['Pipeline', 'Inbox', 'Integrations']
      };
    }

    if (lowerQuery.includes('integrations') || lowerQuery.includes('setup')) {
      return {
        content: "To set up integrations:\n\n1. Go to Settings → Integrations\n2. Click 'Connect Gmail' or 'Connect Calendar'\n3. Follow the OAuth flow\n4. Grant necessary permissions\n5. Your data will start syncing automatically",
        suggestions: ['Dashboard', 'Pipeline', 'Calendar']
      };
    }

    if (lowerQuery.includes('pipeline') || lowerQuery.includes('stages')) {
      return {
        content: "To create your pipeline:\n\n1. Go to Settings → Pipeline\n2. Click 'Add Stage' to create new stages\n3. Drag stages to reorder them\n4. Set colors and names for each stage\n5. Add automation rules if needed",
        suggestions: ['Dashboard', 'Leads', 'Analytics']
      };
    }

    if (lowerQuery.includes('ai') || lowerQuery.includes('features')) {
      return {
        content: "Rivor's AI features include:\n\n🤖 **Email Drafting**: AI helps compose follow-up emails\n📊 **Lead Analysis**: Get insights about lead quality\n📈 **Pipeline Optimization**: AI suggests improvements\n💬 **Smart Responses**: Auto-generate contextual replies\n📋 **Task Automation**: AI creates tasks based on interactions",
        suggestions: ['Dashboard', 'Inbox', 'Pipeline']
      };
    }

    // Default response
    return {
      content: "I can help you with:\n\n• Dashboard customization and navigation\n• Setting up email and calendar integrations\n• Creating and managing your sales pipeline\n• Using AI features for lead management\n• Understanding analytics and reports\n\nWhat specific area would you like to learn more about?",
      suggestions: ['Dashboard', 'Integrations', 'Pipeline', 'AI Features']
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="relative w-full max-w-2xl h-[600px] bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Rivor Assistant</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">AI-powered help and guidance</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="flex items-start gap-3 p-3 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-blue-500 mt-0.5">{action.icon}</div>
                    <div>
                      <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {action.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about Rivor..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
