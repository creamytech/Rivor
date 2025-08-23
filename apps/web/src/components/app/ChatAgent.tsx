"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Lightbulb,
  BookOpen,
  Zap
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

  const handleSendMessage = async (contentOverride?: string) => {
    const content = contentOverride ?? inputValue;
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      type: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.token) {
              assistantMessage.content += data.token;
            } else if (typeof data === 'string') {
              assistantMessage.content += data;
            }
            if (data.suggestions) {
              assistantMessage.suggestions = data.suggestions;
            }
          } catch {
            assistantMessage.content += line;
          }
          setMessages(prev =>
            prev.map(m => (m.id === assistantId ? { ...assistantMessage } : m))
          );
        }
      }
    } catch (err) {
      assistantMessage.content = 'Sorry, something went wrong.';
      setMessages(prev =>
        prev.map(m => (m.id === assistantId ? { ...assistantMessage } : m))
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (!action) return;
    handleSendMessage(action.title);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
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
            className="glass-modal relative w-full max-w-2xl h-[600px] rounded-lg shadow-2xl overflow-hidden"
            style={{
              background: 'var(--glass-surface)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(24px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{
                borderColor: 'var(--glass-border)',
                background: 'var(--glass-surface-subtle)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--glass-text)' }}>Rivor Assistant</h3>
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>AI-powered help and guidance</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div 
              className="p-4 border-b"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="flex items-start gap-3 p-3 text-left rounded-lg transition-all duration-200"
                    style={{
                      background: 'var(--glass-surface-subtle)',
                      border: '1px solid var(--glass-border)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--glass-surface-hover)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--glass-surface-subtle)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div className="text-blue-500 mt-0.5">{action.icon}</div>
                    <div>
                      <h4 className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>
                        {action.title}
                      </h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--glass-text-muted)' }}>
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
                      className="max-w-[80%] p-3 rounded-lg"
                      style={{
                        background: message.type === 'user' 
                          ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                          : 'var(--glass-surface-subtle)',
                        color: message.type === 'user' 
                          ? '#ffffff' 
                          : 'var(--glass-text)',
                        border: message.type === 'assistant' 
                          ? '1px solid var(--glass-border)' 
                          : 'none',
                        backdropFilter: message.type === 'assistant' 
                          ? 'blur(8px)' 
                          : 'none',
                        WebkitBackdropFilter: message.type === 'assistant' 
                          ? 'blur(8px)' 
                          : 'none'
                      }}
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
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'var(--glass-surface)',
                          border: '1px solid var(--glass-border)'
                        }}
                      >
                        <User className="h-4 w-4" style={{ color: 'var(--glass-text-muted)' }} />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div 
                      className="p-3 rounded-lg"
                      style={{
                        background: 'var(--glass-surface-subtle)',
                        border: '1px solid var(--glass-border)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                      }}
                    >
                      <div className="flex gap-1">
                        <div 
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: 'var(--glass-text-muted)' }}
                        ></div>
                        <div 
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: 'var(--glass-text-muted)', animationDelay: '0.1s' }}
                        ></div>
                        <div 
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: 'var(--glass-text-muted)', animationDelay: '0.2s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div 
              className="p-4 border-t"
              style={{ 
                borderColor: 'var(--glass-border)',
                background: 'var(--glass-surface-subtle)'
              }}
            >
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about Rivor..."
                  className="flex-1 glass-input"
                  style={{
                    background: 'var(--glass-surface)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--glass-text)'
                  }}
                />
                <Button 
                  onClick={() => handleSendMessage()} 
                  disabled={!inputValue.trim()}
                  className="glass-button"
                  variant="liquid"
                >
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
