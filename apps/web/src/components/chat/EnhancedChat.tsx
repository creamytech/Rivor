"use client";
import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
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
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
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
            <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-xl h-[600px] flex flex-col">
              <div className="p-6 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    🤖 {getContextLabel()}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-xs border border-white/20 rounded bg-white/10 hover:bg-white/20">
                      Settings
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-0 flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🤖</div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        Welcome to your AI Assistant
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        I can help you manage leads, contacts, schedule meetings, and more.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <span className="px-2 py-1 text-xs border border-white/20 rounded bg-white/10">
                          "Show me my leads"
                        </span>
                        <span className="px-2 py-1 text-xs border border-white/20 rounded bg-white/10">
                          "Schedule a meeting"
                        </span>
                        <span className="px-2 py-1 text-xs border border-white/20 rounded bg-white/10">
                          "Create a follow-up task"
                        </span>
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
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
                            🤖
                          </div>
                        )}
                        
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                          <div className={`p-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          
                          <div className="mt-1 text-xs text-slate-500">
                            {message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString() : new Date().toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-sm">
                            👤
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
                        🤖
                      </div>
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
                    <input
                      type="text"
                      placeholder="Ask me anything about your leads, contacts, or schedule..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 rounded-md px-3 py-2 text-sm"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                    >
                      📤
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Context Panel */}
          <div className="space-y-6">
            {/* Context Information */}
            {context && context.type && context.id && (
              <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-xl">
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    💬 Context
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs border border-white/20 rounded bg-white/10">
                        {context.type}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        ID: {context.id}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      I have access to this {context.type}'s data and can help you manage it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-xl">
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  ⚡ Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    className="w-full text-left px-3 py-2 text-xs border border-white/20 rounded bg-white/10 hover:bg-white/20"
                    onClick={() => setInputMessage("Show me my leads")}
                  >
                    📋 View Leads
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-xs border border-white/20 rounded bg-white/10 hover:bg-white/20"
                    onClick={() => setInputMessage("Schedule a meeting")}
                  >
                    📅 Schedule Meeting
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-xs border border-white/20 rounded bg-white/10 hover:bg-white/20"
                    onClick={() => setInputMessage("Create a follow-up task")}
                  >
                    ✅ Create Task
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-xs border border-white/20 rounded bg-white/10 hover:bg-white/20"
                    onClick={() => setInputMessage("Send an email")}
                  >
                    📧 Send Email
                  </button>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-xl">
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  ❓ What I Can Do
                </h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>🤖</span>
                    <span>Access your CRM data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>Schedule meetings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span>Create tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <span>Send emails</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⬆️</span>
                    <span>Update leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span>Create contacts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
