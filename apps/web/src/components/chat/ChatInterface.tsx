"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlowCard from '@/components/river/FlowCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send,
  Bot,
  User,
  Search,
  Calendar,
  Users,
  CheckSquare,
  ExternalLink,
  Sparkles,
  Clock,
  Mail,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/river/RiverToast';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
  toolCalls?: ToolCall[];
}

interface ChatSource {
  id: string;
  type: 'email' | 'lead' | 'contact' | 'event' | 'task';
  title: string;
  url: string;
  snippet?: string;
}

interface ToolCall {
  id: string;
  tool: string;
  parameters: Record<string, any>;
  result?: any;
}

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions] = useState([
    "Summarize emails from this week",
    "Show me upcoming meetings",
    "Create a follow-up task for Sarah",
    "Find leads in the pipeline",
    "Search emails about pricing"
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: "Hi! I'm your AI assistant. I can help you search emails, manage leads, schedule events, and create tasks. What would you like to do?",
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim(), history: messages })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: data.content,
        timestamp: new Date(),
        sources: data.sources || [],
        toolCalls: data.toolCalls || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show success toast if tools were used
      if (data.toolCalls?.length > 0) {
        addToast({
          type: 'success',
          title: 'Action completed',
          description: `Used ${data.toolCalls.length} tool${data.toolCalls.length !== 1 ? 's' : ''} to help you`
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      addToast({
        type: 'error',
        title: 'Chat Error',
        description: 'Failed to get response from assistant'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleSourceClick = (source: ChatSource) => {
    // Navigate to the source
    window.location.href = source.url;
  };

  const getSourceIcon = (type: ChatSource['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'lead':
        return <TrendingUp className="h-3 w-3" />;
      case 'contact':
        return <Users className="h-3 w-3" />;
      case 'event':
        return <Calendar className="h-3 w-3" />;
      case 'task':
        return <CheckSquare className="h-3 w-3" />;
      default:
        return <ExternalLink className="h-3 w-3" />;
    }
  };

  const getSourceColor = (type: ChatSource['type']) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'lead':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'contact':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
      case 'event':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      case 'task':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <FlowCard className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-azure-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              AI Assistant
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Get help with emails, leads, calendar, and tasks
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex gap-3',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-azure-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div className="max-w-[80%] space-y-2">
                  <div className={cn(
                    'rounded-2xl px-4 py-3',
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-azure-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ExternalLink className="h-3 w-3" />
                        <span>Sources used:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.sources.map((source) => (
                          <motion.button
                            key={source.id}
                            onClick={() => handleSourceClick(source)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
                              'transition-colors hover:opacity-80',
                              getSourceColor(source.type)
                            )}
                            whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                          >
                            {getSourceIcon(source.type)}
                            <span>{source.title}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(message.timestamp)}</span>
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-azure-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-6 pb-4">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Try asking:
            </h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full transition-colors"
                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-3"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your emails, leads, or calendar..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </FlowCard>
  );
}
