"use client";
import { useState, useEffect, useRef } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  Eye, 
  EyeOff,
  Calendar,
  Task,
  Mail,
  ArrowUp,
  UserPlus,
  Edit,
  Clock,
  Brain,
  Sparkles,
  MessageSquare,
  Settings,
  HelpCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  reasoning?: string;
  actions?: Array<{
    type: string;
    label: string;
    data?: any;
  }>;
}

interface EnhancedChatProps {
  className?: string;
  context?: {
    type: 'lead' | 'contact' | 'thread';
    id: string;
  };
}

export default function EnhancedChat({ className = '', context }: EnhancedChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        content: `I received your message: "${inputMessage}". This is a simulated response while we work on connecting the AI service.`,
        role: 'assistant',
        timestamp: new Date(),
        reasoning: 'This is a placeholder response while the AI service is being configured.',
        actions: [
          {
            type: 'create_task',
            label: 'Create follow-up task'
          },
          {
            type: 'schedule_meeting',
            label: 'Schedule meeting'
          }
        ]
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleActionClick = async (action: { type: string; label: string; data?: any }) => {
    if (!action || !action.type || !action.label) {
      console.error('Invalid action object:', action);
      return;
    }

    const actionMessage: ChatMessage = {
      id: `action_${Date.now()}`,
      content: `Action "${action.label}" would be executed here. This is a placeholder while we connect the action system.`,
      role: 'assistant',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, actionMessage]);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create_task': return <Task className="h-4 w-4" />;
      case 'promote_lead': return <ArrowUp className="h-4 w-4" />;
      case 'schedule_meeting': return <Calendar className="h-4 w-4" />;
      case 'send_email': return <Mail className="h-4 w-4" />;
      case 'update_lead': return <Edit className="h-4 w-4" />;
      case 'create_contact': return <UserPlus className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getContextLabel = () => {
    if (!context) return 'General Assistant';
    switch (context.type) {
      case 'lead': return 'Lead Assistant';
      case 'contact': return 'Contact Assistant';
      case 'thread': return 'Email Thread Assistant';
      default: return 'General Assistant';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            AI Assistant
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {getContextLabel()} - Powered by ChatGPT with access to your CRM data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <GlassCard variant="gradient" intensity="medium" className="h-[600px] flex flex-col">
              <GlassCardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <GlassCardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {getContextLabel()}
                  </GlassCardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReasoning(!showReasoning)}
                    >
                      {showReasoning ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showReasoning ? 'Hide' : 'Show'} Reasoning
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassCardHeader>
              
              <GlassCardContent className="flex-1 p-0 flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        Welcome to your AI Assistant
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        I can help you manage leads, contacts, schedule meetings, and more.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="text-xs">
                          "Show me my leads"
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          "Schedule a meeting"
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          "Create a follow-up task"
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    messages.filter(message => 
                      message && 
                      message.id && 
                      message.content && 
                      message.role && 
                      message.timestamp
                    ).map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                          <div className={`p-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          
                          {/* Reasoning */}
                          {showReasoning && message.reasoning && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                              <div className="flex items-center gap-1 mb-1">
                                <Brain className="h-3 w-3" />
                                <span className="font-medium">Reasoning:</span>
                              </div>
                              {message.reasoning}
                            </div>
                          )}
                          
                          {/* Actions */}
                          {message.actions && Array.isArray(message.actions) && message.actions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {message.actions.filter(action => 
                                action && 
                                action.type && 
                                action.label
                              ).map((action, index) => (
                                <Button
                                  key={`${message.id}_action_${index}`}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => handleActionClick(action)}
                                >
                                  {getActionIcon(action.type)}
                                  <span className="ml-1">{action.label}</span>
                                </Button>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-1 text-xs text-slate-500">
                            {message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString() : new Date().toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {message.role === 'user' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input Area */}
                <div className="p-4 border-t border-white/20">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything about your leads, contacts, or schedule..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Context Panel */}
          <div className="space-y-6">
            {/* Context Information */}
            {context && context.type && context.id && (
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Context
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {context.type}
                      </Badge>
                      <span className="text-slate-600 dark:text-slate-400">
                        ID: {context.id}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      I have access to this {context.type}'s data and can help you manage it.
                    </p>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}

            {/* Quick Actions */}
            <GlassCard variant="gradient" intensity="medium">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Quick Actions
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setInputMessage("Show me my leads")}
                  >
                    <Task className="h-3 w-3 mr-2" />
                    View Leads
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setInputMessage("Schedule a meeting")}
                  >
                    <Calendar className="h-3 w-3 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setInputMessage("Create a follow-up task")}
                  >
                    <Task className="h-3 w-3 mr-2" />
                    Create Task
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setInputMessage("Send an email")}
                  >
                    <Mail className="h-3 w-3 mr-2" />
                    Send Email
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Capabilities */}
            <GlassCard variant="gradient" intensity="medium">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  What I Can Do
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Bot className="h-3 w-3" />
                    <span>Access your CRM data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Schedule meetings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Task className="h-3 w-3" />
                    <span>Create tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>Send emails</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3" />
                    <span>Update leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-3 w-3" />
                    <span>Create contacts</span>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
