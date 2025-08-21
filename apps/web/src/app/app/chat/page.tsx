"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import {
  MessageSquare,
  Bot,
  Plus,
  Send,
  Paperclip,
  Sparkles,
  Zap,
  Users,
  Mail,
  Calendar,
  Target,
  TrendingUp,
  Search,
  Clock,
  CheckCircle,
  ArrowRight,
  Settings,
  History,
  Lightbulb,
  BarChart3,
  FileText,
  Globe,
  Mic,
  X
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  actions?: Array<{
    type: string;
    label: string;
    data?: any;
  }>;
}

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  category: 'communication' | 'analytics' | 'automation' | 'insights';
  color: string;
}

export default function AIAssistantPage() {
  const { currentTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI assistant. I can help you with lead management, email drafting, property analysis, and much more. What would you like to work on today?",
      timestamp: new Date(),
      actions: [
        { type: 'draft_email', label: 'Draft Follow-up Email' },
        { type: 'analyze_leads', label: 'Analyze Recent Leads' },
        { type: 'schedule_showing', label: 'Schedule Property Showing' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const quickActions: QuickAction[] = [
    {
      id: 'draft_email',
      icon: <Mail className="h-5 w-5" />,
      title: 'Draft Smart Email',
      description: 'AI-powered email composition with lead context',
      category: 'communication',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'analyze_market',
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Market Analysis',
      description: 'Generate comprehensive market reports',
      category: 'analytics',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'schedule_showing',
      icon: <Calendar className="h-5 w-5" />,
      title: 'Schedule Showing',
      description: 'Intelligent calendar scheduling with availability',
      category: 'automation',
      color: 'from-purple-500 to-violet-500'
    },
    {
      id: 'lead_insights',
      icon: <Users className="h-5 w-5" />,
      title: 'Lead Insights',
      description: 'Deep analysis of lead behavior and preferences',
      category: 'insights',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'property_summary',
      icon: <FileText className="h-5 w-5" />,
      title: 'Property Summary',
      description: 'Auto-generate property descriptions and highlights',
      category: 'communication',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      id: 'pipeline_optimization',
      icon: <Target className="h-5 w-5" />,
      title: 'Pipeline Optimization',
      description: 'Identify bottlenecks and growth opportunities',
      category: 'insights',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Tools', icon: <Globe className="h-4 w-4" /> },
    { id: 'communication', label: 'Communication', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'automation', label: 'Automation', icon: <Zap className="h-4 w-4" /> },
    { id: 'insights', label: 'Insights', icon: <Lightbulb className="h-4 w-4" /> }
  ];

  const filteredActions = activeCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === activeCategory);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I understand your request. Let me help you with that right away. Here are some options I've prepared based on your needs.",
        timestamp: new Date(),
        actions: [
          { type: 'execute', label: 'Execute Action' },
          { type: 'modify', label: 'Modify Request' },
          { type: 'schedule', label: 'Schedule for Later' }
        ]
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleQuickAction = (action: QuickAction) => {
    const message = `Help me with: ${action.title}`;
    setInputValue(message);
    handleSendMessage();
  };

  return (
    <AppShell>
        {/* Modern Header */}
        <div 
          className="sticky top-16 z-10 backdrop-blur-sm border-b glass-theme-surface"
          style={{
            backgroundColor: 'var(--glass-surface-alpha)',
            borderColor: 'var(--glass-border)'
          }}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-xl shadow-lg glass-theme-gradient"
                  style={{
                    background: 'var(--glass-gradient)'
                  }}
                >
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 
                    className="text-2xl font-bold glass-theme-text"
                    style={{ color: 'var(--glass-text)' }}
                  >
                    AI Assistant
                  </h1>
                  <p 
                    className="text-sm glass-theme-text-muted"
                    style={{ color: 'var(--glass-text-muted)' }}
                  >
                    Your intelligent real estate companion
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline"
                  className="flex items-center gap-1.5 px-3 py-1 glass-theme-primary"
                  style={{
                    borderColor: 'var(--glass-primary)',
                    backgroundColor: 'var(--glass-primary-muted)',
                    color: 'var(--glass-primary)'
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  AI Active
                </Badge>
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-8rem)]">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Quick Actions Section */}
            <div className="p-6 border-b glass-theme-border" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="mb-4">
                <h2 
                  className="text-lg font-semibold mb-2 glass-theme-text"
                  style={{ color: 'var(--glass-text)' }}
                >
                  AI Tools & Actions
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={activeCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(category.id)}
                      className="flex items-center gap-2"
                      style={activeCategory === category.id ? {
                        backgroundColor: 'var(--glass-primary)',
                        color: 'var(--glass-text-inverse)'
                      } : {}}
                    >
                      {category.icon}
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                        onClick={() => handleQuickAction(action)}
                        style={{
                          backgroundColor: 'var(--glass-surface)',
                          borderColor: 'var(--glass-border)'
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div 
                              className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white`}
                            >
                              {action.icon}
                            </div>
                            <div className="flex-1">
                              <h3 
                                className="font-medium mb-1 glass-theme-text"
                                style={{ color: 'var(--glass-text)' }}
                              >
                                {action.title}
                              </h3>
                              <p 
                                className="text-sm glass-theme-text-muted"
                                style={{ color: 'var(--glass-text-muted)' }}
                              >
                                {action.description}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity glass-theme-text-muted" style={{ color: 'var(--glass-text-muted)' }} />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6 max-w-4xl">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type === 'ai' && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 glass-theme-gradient"
                          style={{
                            background: 'var(--glass-gradient)'
                          }}
                        >
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-2xl ${message.type === 'user' ? 'text-right' : ''}`}>
                        <div 
                          className={`rounded-2xl p-4 ${
                            message.type === 'user' 
                              ? 'rounded-br-md' 
                              : 'rounded-bl-md'
                          }`}
                          style={{
                            backgroundColor: message.type === 'user' 
                              ? 'var(--glass-primary)' 
                              : 'var(--glass-surface)',
                            color: message.type === 'user' 
                              ? 'var(--glass-text-inverse)' 
                              : 'var(--glass-text)'
                          }}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          
                          {message.actions && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  style={{
                                    borderColor: 'var(--glass-border)',
                                    backgroundColor: 'var(--glass-bg-secondary)'
                                  }}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <p 
                          className={`text-xs mt-1 glass-theme-text-muted ${message.type === 'user' ? 'text-right' : 'text-left'}`}
                          style={{ color: 'var(--glass-text-muted)' }}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      {message.type === 'user' && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 glass-theme-surface-active"
                          style={{ backgroundColor: 'var(--glass-surface-active)' }}
                        >
                          <span 
                            className="text-sm font-medium glass-theme-text"
                            style={{ color: 'var(--glass-text)' }}
                          >
                            U
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4 justify-start"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center glass-theme-gradient"
                      style={{
                        background: 'var(--glass-gradient)'
                      }}
                    >
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div 
                      className="rounded-2xl rounded-bl-md p-4 glass-theme-surface"
                      style={{ backgroundColor: 'var(--glass-surface)' }}
                    >
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full animate-bounce glass-theme-primary" style={{ backgroundColor: 'var(--glass-primary)', animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce glass-theme-primary" style={{ backgroundColor: 'var(--glass-primary)', animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce glass-theme-primary" style={{ backgroundColor: 'var(--glass-primary)', animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div 
              className="p-6 border-t glass-theme-surface"
              style={{ 
                borderColor: 'var(--glass-border)',
                backgroundColor: 'var(--glass-surface)' 
              }}
            >
              <div className="flex gap-3 items-end max-w-4xl">
                <div className="flex-1">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me anything about your real estate business..."
                    className="min-h-[60px] resize-none"
                    style={{
                      backgroundColor: 'var(--glass-bg)',
                      borderColor: 'var(--glass-border)',
                      color: 'var(--glass-text)'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="glass-theme-primary"
                    style={{
                      backgroundColor: 'var(--glass-primary)',
                      color: 'var(--glass-text-inverse)'
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </AppShell>
  );
}