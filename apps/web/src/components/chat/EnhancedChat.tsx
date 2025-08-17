"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Search,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  CheckCircle,
  AlertTriangle,
  Plus,
  Settings,
  Brain,
  Zap,
  Target,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Building,
  Home,
  ChevronRight,
  ExternalLink,
  Copy,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string;
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  actions?: Array<{
    type: 'create_task' | 'promote_lead' | 'dismiss_lead' | 'schedule_meeting' | 'send_email';
    description: string;
    executed: boolean;
    result?: string;
  }>;
}

interface ToolChip {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: () => void;
}

interface ThreadContext {
  type: 'inbox' | 'pipeline' | 'calendar' | 'contacts';
  id: string;
  title: string;
  description: string;
}

export default function EnhancedChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [threadContext, setThreadContext] = useState<ThreadContext | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Can you help me summarize this week\'s leads and suggest follow-up actions?',
        timestamp: new Date(Date.now() - 300000),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'I\'ve analyzed your leads from this week. Here\'s a summary:\n\n• **New Leads**: 12 (8 buyers, 3 sellers, 1 renter)\n• **High Priority**: 3 leads with >80% confidence\n• **Follow-ups Needed**: 5 leads awaiting response\n\n**Suggested Actions**:\n1. Schedule property viewings for the 3 high-priority buyers\n2. Send market analysis to the seller leads\n3. Follow up on the 5 pending responses\n\nWould you like me to help you execute any of these actions?',
        timestamp: new Date(Date.now() - 240000),
        reasoning: 'Analyzed lead data from CRM, identified patterns in buyer/seller distribution, calculated confidence scores, and prioritized based on engagement levels.',
        entities: [
          { type: 'lead_count', value: '12', confidence: 0.95 },
          { type: 'buyer_count', value: '8', confidence: 0.92 },
          { type: 'seller_count', value: '3', confidence: 0.88 },
          { type: 'renter_count', value: '1', confidence: 0.85 },
          { type: 'high_priority', value: '3', confidence: 0.90 }
        ],
        actions: [
          {
            type: 'create_task',
            description: 'Schedule property viewings for high-priority buyers',
            executed: false
          },
          {
            type: 'send_email',
            description: 'Send market analysis to seller leads',
            executed: false
          }
        ]
      }
    ];

    const mockContext: ThreadContext = {
      type: 'inbox',
      id: 'thread-123',
      title: 'Property inquiry - 123 Main St',
      description: 'Assistant is using thread #123 • change'
    };

    setMessages(mockMessages);
    setThreadContext(mockContext);
  }, []);

  const toolChips: ToolChip[] = [
    {
      id: 'summarize',
      label: 'Summarize this week',
      icon: <FileText className="h-4 w-4" />,
      description: 'Get a summary of your weekly activities',
      action: () => {
        setInputValue('Summarize this week\'s leads and activities');
        setSelectedTool('summarize');
      }
    },
    {
      id: 'find-leads',
      label: 'Find leads',
      icon: <Search className="h-4 w-4" />,
      description: 'Search for specific leads or patterns',
      action: () => {
        setInputValue('Find leads with high confidence scores');
        setSelectedTool('find-leads');
      }
    },
    {
      id: 'schedule',
      label: 'Schedule for Friday',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Schedule meetings or follow-ups',
      action: () => {
        setInputValue('Schedule follow-up calls for Friday');
        setSelectedTool('schedule');
      }
    },
    {
      id: 'draft-reply',
      label: 'Draft reply',
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Draft email replies',
      action: () => {
        setInputValue('Draft a professional reply to the property inquiry');
        setSelectedTool('draft-reply');
      }
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setSelectedTool(null);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about "${userMessage.content}". Let me help you with that. I can analyze your data, create tasks, schedule meetings, or draft responses. What specific action would you like me to take?`,
        timestamp: new Date(),
        reasoning: 'Processed user query, identified intent, and offered relevant assistance options based on available tools and context.',
        entities: [
          { type: 'intent', value: 'assistance_request', confidence: 0.85 },
          { type: 'context', value: 'workflow_help', confidence: 0.78 }
        ],
        actions: [
          {
            type: 'create_task',
            description: 'Create a task based on your request',
            executed: false
          }
        ]
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleActionExecute = (messageId: string, actionIndex: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.actions) {
        const updatedActions = [...msg.actions];
        updatedActions[actionIndex] = {
          ...updatedActions[actionIndex],
          executed: true,
          result: 'Action completed successfully'
        };
        return { ...msg, actions: updatedActions };
      }
      return msg;
    }));
  };

  const renderMessage = (message: ChatMessage) => (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-4 p-4',
        message.role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {message.role === 'assistant' && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        'max-w-[80%] space-y-3',
        message.role === 'user' ? 'order-first' : 'order-last'
      )}>
        <div className={cn(
          'p-4 rounded-lg',
          message.role === 'user' 
            ? 'bg-blue-500 text-white' 
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
        )}>
          <div className="whitespace-pre-wrap text-sm">
            {message.content}
          </div>
        </div>

        {/* Reasoning Section */}
        {message.role === 'assistant' && showReasoning && message.reasoning && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Reasoning
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {message.reasoning}
            </p>
            
            {/* Entities */}
            {message.entities && message.entities.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-3 w-3 text-slate-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Entities Found
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {message.entities.map((entity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {entity.type}: {entity.value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
          <div className="space-y-2">
            {message.actions.map((action, index) => (
              <div
                key={index}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  action.executed
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer'
                )}
                onClick={() => !action.executed && handleActionExecute(message.id, index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {action.executed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Zap className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {action.description}
                    </span>
                  </div>
                  {action.executed && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {action.result}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-slate-500">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>

      {message.role === 'user' && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Thread Context Breadcrumb */}
      {threadContext && (
        <GlassCard variant="gradient" intensity="light">
          <GlassCardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {threadContext.title}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="text-slate-900 dark:text-slate-100 font-medium">
                {threadContext.description}
              </span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                Change
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Tool Chips */}
      <GlassCard variant="gradient" intensity="medium">
        <GlassCardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Quick Actions:
            </span>
            {toolChips.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? 'default' : 'outline'}
                size="sm"
                onClick={tool.action}
                className="text-xs"
              >
                {tool.icon}
                <span className="ml-1">{tool.label}</span>
              </Button>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Chat Interface */}
      <GlassCard variant="gradient" intensity="medium" className="min-h-[600px]">
        <GlassCardContent className="p-0">
          <div className="flex flex-col h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <Bot className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    AI Assistant
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Ask me anything about your leads, emails, or tasks
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-500" />
                  <Switch
                    checked={showReasoning}
                    onCheckedChange={setShowReasoning}
                    size="sm"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Show reasoning
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Ask me to help with leads, emails, scheduling, or any other tasks
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {toolChips.slice(0, 2).map((tool) => (
                      <Button
                        key={tool.id}
                        variant="outline"
                        size="sm"
                        onClick={tool.action}
                      >
                        {tool.icon}
                        <span className="ml-1">{tool.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 p-4"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Thinking...
                    </span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything about your leads, emails, or tasks..."
                  className="flex-1 min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
