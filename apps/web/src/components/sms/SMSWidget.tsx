"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Phone,
  Send,
  X,
  Plus,
  Search,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Users,
  Settings,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SMSMessage {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  contactId?: string;
}

interface SMSThread {
  id: string;
  contactId: string;
  contactName: string;
  phoneNumber: string;
  avatar?: string;
  messages: SMSMessage[];
  lastMessageAt: Date;
  unreadCount: number;
  isActive: boolean;
}

interface SMSContact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  lastContact?: Date;
  tags?: string[];
}

const MESSAGE_TEMPLATES = [
  {
    category: 'Scheduling',
    templates: [
      { title: 'Running Late', content: 'Hi {name}, running about 5 minutes late for our appointment. See you soon!' },
      { title: 'Confirm Showing', content: 'Hi {name}, confirming our property showing today at {time}. See you there!' },
      { title: 'Reschedule', content: 'Hi {name}, need to reschedule our appointment. When works better for you?' }
    ]
  },
  {
    category: 'Updates',
    templates: [
      { title: 'Documents Ready', content: 'Hi {name}, your documents are ready for review. Let me know when you can stop by!' },
      { title: 'New Listing', content: 'Hi {name}, found a perfect property match for you! {property_address}. Interested in viewing?' },
      { title: 'Price Update', content: 'Hi {name}, great news! The property at {property_address} just reduced price to {price}.' }
    ]
  },
  {
    category: 'Follow-up',
    templates: [
      { title: 'Check-in', content: 'Hi {name}, checking in about the property we viewed. Any thoughts or questions?' },
      { title: 'Thank You', content: 'Hi {name}, thank you for choosing me as your agent. Looking forward to helping you!' },
      { title: 'Next Steps', content: 'Hi {name}, here are the next steps: {steps}. Let me know if you have questions!' }
    ]
  }
];

interface SMSWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  initialContactId?: string;
  className?: string;
}

export default function SMSWidget({ isOpen, onClose, initialContactId, className = '' }: SMSWidgetProps) {
  const [threads, setThreads] = useState<SMSThread[]>([]);
  const [activeThread, setActiveThread] = useState<SMSThread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [contacts, setContacts] = useState<SMSContact[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock data for development
  useEffect(() => {
    const mockContacts: SMSContact[] = [
      {
        id: 'contact-1',
        name: 'Sarah Johnson',
        phoneNumber: '+1234567890',
        avatar: undefined,
        tags: ['buyer', 'first-time']
      },
      {
        id: 'contact-2', 
        name: 'Mike Chen',
        phoneNumber: '+1987654321',
        avatar: undefined,
        tags: ['seller', 'investor']
      },
      {
        id: 'contact-3',
        name: 'Emma Rodriguez',
        phoneNumber: '+1555123456',
        avatar: undefined,
        tags: ['buyer', 'luxury']
      }
    ];

    const mockThreads: SMSThread[] = [
      {
        id: 'thread-1',
        contactId: 'contact-1',
        contactName: 'Sarah Johnson',
        phoneNumber: '+1234567890',
        lastMessageAt: new Date(Date.now() - 30 * 60000),
        unreadCount: 2,
        isActive: true,
        messages: [
          {
            id: 'msg-1',
            content: 'Hi! Are we still on for the property viewing at 2pm?',
            direction: 'inbound',
            status: 'read',
            timestamp: new Date(Date.now() - 45 * 60000),
            contactId: 'contact-1'
          },
          {
            id: 'msg-2',
            content: 'Yes, absolutely! See you at 123 Oak Street at 2pm.',
            direction: 'outbound',
            status: 'delivered',
            timestamp: new Date(Date.now() - 30 * 60000)
          }
        ]
      },
      {
        id: 'thread-2',
        contactId: 'contact-2',
        contactName: 'Mike Chen',
        phoneNumber: '+1987654321',
        lastMessageAt: new Date(Date.now() - 2 * 60 * 60000),
        unreadCount: 0,
        isActive: true,
        messages: [
          {
            id: 'msg-3',
            content: 'Thanks for the market analysis report!',
            direction: 'inbound',
            status: 'read',
            timestamp: new Date(Date.now() - 2 * 60 * 60000),
            contactId: 'contact-2'
          }
        ]
      }
    ];

    setContacts(mockContacts);
    setThreads(mockThreads);

    if (initialContactId) {
      const thread = mockThreads.find(t => t.contactId === initialContactId);
      if (thread) setActiveThread(thread);
    }
  }, [initialContactId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isMinimized) {
      inputRef.current.focus();
    }
  }, [isOpen, activeThread, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageStatus = (status: SMSMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-500" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || newMessage.trim();
    if (!messageContent || !activeThread) return;

    const newMsg: SMSMessage = {
      id: Date.now().toString(),
      content: messageContent,
      direction: 'outbound',
      status: 'sending',
      timestamp: new Date()
    };

    // Add message to thread
    setActiveThread(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMsg],
      lastMessageAt: new Date()
    } : null);

    setNewMessage('');
    setIsLoading(true);

    try {
      // Call SendBlue API here
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: activeThread.phoneNumber,
          message: messageContent,
          contactId: activeThread.contactId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update message status
        setActiveThread(prev => prev ? {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === newMsg.id ? { ...msg, status: 'sent', id: data.messageId } : msg
          )
        } : null);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      // Update message status to failed
      setActiveThread(prev => prev ? {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === newMsg.id ? { ...msg, status: 'failed' } : msg
        )
      } : null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: { title: string; content: string }) => {
    const processedContent = template.content
      .replace('{name}', activeThread?.contactName || 'there')
      .replace('{time}', '2:00 PM')
      .replace('{property_address}', '123 Main Street')
      .replace('{price}', '$450,000')
      .replace('{steps}', '1. Review docs 2. Schedule inspection');
    
    setNewMessage(processedContent);
    setShowTemplates(false);
    inputRef.current?.focus();
  };

  const startNewThread = (contact: SMSContact) => {
    const existingThread = threads.find(t => t.contactId === contact.id);
    if (existingThread) {
      setActiveThread(existingThread);
    } else {
      const newThread: SMSThread = {
        id: `thread-${Date.now()}`,
        contactId: contact.id,
        contactName: contact.name,
        phoneNumber: contact.phoneNumber,
        avatar: contact.avatar,
        messages: [],
        lastMessageAt: new Date(),
        unreadCount: 0,
        isActive: true
      };
      setThreads(prev => [newThread, ...prev]);
      setActiveThread(newThread);
    }
    setShowContacts(false);
  };

  const filteredThreads = threads.filter(thread =>
    thread.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.phoneNumber.includes(searchQuery)
  );

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  const totalUnread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 ${className}`}
      >
        <div 
          className={`glass-modal rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
          }`}
          style={{
            background: 'var(--glass-surface)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(24px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.3)'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b cursor-pointer"
            style={{ borderColor: 'var(--glass-border)' }}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                {totalUnread > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                    {totalUnread}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--glass-text)' }}>
                  {activeThread ? activeThread.contactName : 'SMS Messages'}
                </h3>
                <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                  {activeThread ? activeThread.phoneNumber : `${threads.length} conversations`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Action Buttons */}
              <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <Button
                  variant={showContacts ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowContacts(!showContacts);
                    setShowTemplates(false);
                  }}
                  className="glass-button-secondary"
                >
                  <Users className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button
                  variant={showTemplates ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowTemplates(!showTemplates);
                    setShowContacts(false);
                  }}
                  className="glass-button-secondary"
                  disabled={!activeThread}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </div>

              {/* Search */}
              <div className="p-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                         style={{ color: 'var(--glass-text-muted)' }} />
                  <Input
                    placeholder={showContacts ? "Search contacts..." : "Search conversations..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass-input"
                  />
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {showContacts ? (
                  <ScrollArea className="h-80">
                    <div className="p-3 space-y-2">
                      {filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => startNewThread(contact)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" style={{ color: 'var(--glass-text)' }}>
                              {contact.name}
                            </p>
                            <p className="text-sm truncate" style={{ color: 'var(--glass-text-muted)' }}>
                              {contact.phoneNumber}
                            </p>
                            {contact.tags && contact.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {contact.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : showTemplates ? (
                  <ScrollArea className="h-80">
                    <div className="p-3 space-y-4">
                      {MESSAGE_TEMPLATES.map((category) => (
                        <div key={category.category}>
                          <h4 className="font-medium mb-2" style={{ color: 'var(--glass-text)' }}>
                            {category.category}
                          </h4>
                          <div className="space-y-2">
                            {category.templates.map((template) => (
                              <button
                                key={template.title}
                                onClick={() => handleTemplateSelect(template)}
                                className="w-full text-left p-3 rounded-lg border border-transparent hover:border-blue-500/50 hover:bg-blue-50/5 transition-colors"
                              >
                                <h5 className="font-medium text-sm mb-1" style={{ color: 'var(--glass-text)' }}>
                                  {template.title}
                                </h5>
                                <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                  {template.content.substring(0, 60)}...
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : activeThread ? (
                  /* Messages View */
                  <>
                    <ScrollArea className="h-80 p-3">
                      <div className="space-y-4">
                        {activeThread.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.direction === 'outbound'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white/10 border border-white/20'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <div className={`flex items-center gap-1 mt-2 ${
                                message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                              }`}>
                                <span className="text-xs opacity-70">
                                  {new Date(message.timestamp).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {message.direction === 'outbound' && getMessageStatus(message.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div ref={messagesEndRef} />
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                      <div className="flex gap-2">
                        <Input
                          ref={inputRef}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 glass-input"
                          disabled={isLoading}
                        />
                        <Button 
                          onClick={() => handleSendMessage()}
                          disabled={!newMessage.trim() || isLoading}
                          className="glass-button"
                          variant="liquid"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs" 
                           style={{ color: 'var(--glass-text-muted)' }}>
                        <span>{newMessage.length}/160</span>
                        {newMessage.length > 160 && (
                          <span className="text-orange-500">
                            {Math.ceil(newMessage.length / 160)} segments
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Thread List */
                  <ScrollArea className="h-80">
                    <div className="p-3 space-y-2">
                      {filteredThreads.map((thread) => (
                        <button
                          key={thread.id}
                          onClick={() => setActiveThread(thread)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {thread.contactName.split(' ').map(n => n[0]).join('')}
                            </div>
                            {thread.unreadCount > 0 && (
                              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                                {thread.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate" style={{ color: 'var(--glass-text)' }}>
                                {thread.contactName}
                              </p>
                              <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                {new Date(thread.lastMessageAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <p className="text-sm truncate" style={{ color: 'var(--glass-text-muted)' }}>
                              {thread.messages.length > 0 
                                ? thread.messages[thread.messages.length - 1].content
                                : 'No messages yet'
                              }
                            </p>
                          </div>
                        </button>
                      ))}
                      
                      {filteredThreads.length === 0 && (
                        <div className="text-center py-8">
                          <MessageSquare className="h-8 w-8 mx-auto mb-4" style={{ color: 'var(--glass-text-muted)' }} />
                          <p style={{ color: 'var(--glass-text-muted)' }}>
                            {searchQuery ? 'No conversations found' : 'No conversations yet'}
                          </p>
                          <Button
                            variant="liquid"
                            size="sm"
                            className="mt-3"
                            onClick={() => setShowContacts(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Start New Chat
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}