"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Bot,
  MessageSquare,
  Zap,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Settings,
  Sparkles,
  Send,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Image,
  Paperclip,
  MoreHorizontal
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export default function AIAssistantPage() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI real estate assistant. I can help you with market analysis, lead management, property insights, and much more. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call OpenAI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please check that your OpenAI API key is configured and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "Analyze the current real estate market trends",
    "Help me write a property listing",
    "Create a follow-up email for a lead",
    "Calculate investment property ROI",
    "Generate a market report for clients",
    "Draft a purchase agreement summary"
  ];

  const handleFeatureClick = (feature: string) => {
    setSelectedFeature(feature);
  };

  return (
    <div className={`min-h-screen ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        <div className="container mx-auto px-6 py-6">
          {/* Liquid Glass Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card glass-border-active mb-6"
            style={{ 
              backgroundColor: 'var(--glass-surface)', 
              color: 'var(--glass-text)',
              backdropFilter: 'var(--glass-blur)'
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="glass-icon-container">
                    <Bot className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold glass-text-gradient">AI Assistant</h1>
                    <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                      Your intelligent real estate companion
                    </p>
                  </div>
                </div>
                
                <div className="glass-pill-container">
                  {[
                    { id: 'chat', label: 'Chat', icon: MessageSquare },
                    { id: 'tools', label: 'Tools', icon: Settings },
                  ].map((tab) => (
                    <Button
                      key={tab.id}
                      variant={selectedFeature === tab.id ? 'liquid' : 'ghost'}
                      size="sm"
                      onClick={() => handleFeatureClick(tab.id)}
                      className="glass-pill-button"
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {selectedFeature === 'chat' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chat Interface */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-3 glass-card glass-border-active"
                style={{ backgroundColor: 'var(--glass-surface)' }}
              >
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--glass-text)' }}>
                        AI Real Estate Assistant
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                        Online • Powered by OpenAI
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className={`glass-task-card ${
                            message.role === 'user' 
                              ? 'glass-priority-high ml-auto' 
                              : 'glass-status-in-progress'
                          }`}>
                            <div className="flex items-start gap-3">
                              {message.role === 'assistant' && (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                  <Bot className="h-3 w-3 text-white" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm" style={{ color: 'var(--glass-text)' }}>
                                  {message.content}
                                </p>
                                <p className="text-xs mt-2" style={{ color: 'var(--glass-text-muted)' }}>
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              {message.role === 'assistant' && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="glass-task-card glass-status-in-progress">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <Loader2 className="h-3 w-3 text-white animate-spin" />
                          </div>
                          <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                            AI is thinking...
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200/20">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about real estate..."
                        className="glass-input resize-none min-h-[44px] max-h-32 pr-12"
                        disabled={isLoading}
                      />
                      <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Paperclip className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Mic className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      variant="liquid"
                      className="glass-hover-glow"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions Sidebar */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                <div className="glass-card glass-border" style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                  <div className="p-4">
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>
                      Quick Prompts
                    </h3>
                    <div className="space-y-2">
                      {quickPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setInputMessage(prompt)}
                          className="w-full text-left p-2 rounded-lg glass-filter-pill text-xs hover:scale-105 transition-transform"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card glass-border" style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                  <div className="p-4">
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>
                      AI Capabilities
                    </h3>
                    <div className="space-y-2 text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        Market Analysis
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Document Writing
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        Lead Insights
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Scheduling Help
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            /* AI Tools Grid */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: <TrendingUp className="h-6 w-6" />,
                  title: "Market Analysis",
                  description: "AI-powered insights on market conditions and pricing strategies",
                  status: "Available"
                },
                {
                  icon: <Users className="h-6 w-6" />,
                  title: "Lead Scoring",
                  description: "Automatically score and prioritize leads based on engagement",
                  status: "Available"
                },
                {
                  icon: <Calendar className="h-6 w-6" />,
                  title: "Smart Scheduling",
                  description: "AI-assisted appointment scheduling and follow-up reminders",
                  status: "Available"
                },
                {
                  icon: <FileText className="h-6 w-6" />,
                  title: "Document Generation",
                  description: "Generate contracts, proposals, and listings with AI assistance",
                  status: "Beta"
                },
                {
                  icon: <Sparkles className="h-6 w-6" />,
                  title: "Personalized Insights",
                  description: "Custom recommendations based on your business patterns",
                  status: "Beta"
                },
                {
                  icon: <Zap className="h-6 w-6" />,
                  title: "Automation Hub",
                  description: "Set up automated workflows and responses",
                  status: "Coming Soon"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-task-card group cursor-pointer"
                  onClick={() => feature.status === 'Available' || feature.status === 'Beta' ? 
                    setInputMessage(`Help me with ${feature.title.toLowerCase()}`) : null}
                >
                  <div className="flex items-start gap-4">
                    <div className="glass-icon-container-small">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold" style={{ color: 'var(--glass-text)' }}>
                          {feature.title}
                        </h3>
                        <Badge 
                          variant={
                            feature.status === 'Available' ? 'default' :
                            feature.status === 'Beta' ? 'secondary' :
                            'outline'
                          }
                          className={
                            feature.status === 'Available' ? 'glass-status-completed' :
                            feature.status === 'Beta' ? 'glass-status-in-progress' :
                            'glass-status-todo'
                          }
                        >
                          {feature.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--glass-text-muted)' }}>
                        {feature.description}
                      </p>
                      <Button 
                        size="sm" 
                        variant={feature.status === 'Available' ? 'liquid' : 'outline'}
                        disabled={feature.status === 'Coming Soon'}
                        className="glass-hover-pulse"
                      >
                        {feature.status === 'Available' ? 'Try Now' : 
                         feature.status === 'Beta' ? 'Try Beta' : 'Coming Soon'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </AppShell>
    </div>
  );
}