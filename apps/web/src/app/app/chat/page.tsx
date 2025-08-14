"use client";
import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Send, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Bot, 
  User, 
  Calendar, 
  Mail, 
  FileText, 
  Search,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MessageSquare,
  Lightbulb,
  Zap,
  CheckCircle,
  Users,
  Settings,
  RefreshCw
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
  actions?: {
    id: string;
    type: "draft_email" | "create_task" | "schedule_meeting" | "log_note";
    title: string;
    description?: string;
    completed?: boolean;
  }[];
};

type Conversation = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  context?: "email" | "lead" | "contact" | "general";
  contextId?: string;
};

const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Follow-up for 123 Main St property",
    lastMessage: "I've drafted a follow-up email for John Smith about the property viewing.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    messageCount: 8,
    context: "email",
    contextId: "thread-1"
  },
  {
    id: "2", 
    title: "Lead qualification questions",
    lastMessage: "Here are some qualifying questions you can ask potential commercial clients...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messageCount: 12,
    context: "lead",
    contextId: "lead-3"
  },
  {
    id: "3",
    title: "Pipeline strategy discussion",
    lastMessage: "Based on your current pipeline, I recommend focusing on the negotiation stage...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messageCount: 5,
    context: "general"
  }
];

const mockMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "Can you help me draft a follow-up email for the client interested in 123 Main Street?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: "2",
    role: "assistant", 
    content: "I'd be happy to help you draft a follow-up email for the 123 Main Street property inquiry. Based on the context from your recent email thread with John Smith, I'll create a personalized follow-up that addresses his specific interests.\n\nLet me draft something that's professional yet warm, and includes the key details he mentioned.",
    timestamp: new Date(Date.now() - 1000 * 60 * 58),
    sources: ["Email thread: John Smith - Property Inquiry", "Lead profile: John Smith"],
    actions: [
      {
        id: "draft-1",
        type: "draft_email",
        title: "Draft follow-up email",
        description: "Professional follow-up addressing viewing availability and property details",
        completed: true
      }
    ]
  },
  {
    id: "3",
    role: "user",
    content: "That looks great! Can you also schedule a reminder for me to follow up if I don't hear back in 3 days?",
    timestamp: new Date(Date.now() - 1000 * 60 * 55),
  },
  {
    id: "4",
    role: "assistant",
    content: "Absolutely! I'll create a reminder task for you to follow up in 3 days if you don't receive a response. This will help ensure no leads fall through the cracks.\n\nI've also added a note to John Smith's lead profile about this follow-up sequence so you have full context when the reminder triggers.",
    timestamp: new Date(Date.now() - 1000 * 60 * 53),
    sources: ["Lead profile: John Smith", "Task management system"],
    actions: [
      {
        id: "task-1",
        type: "create_task",
        title: "Follow-up reminder: John Smith",
        description: "Reminder to follow up on 123 Main St property if no response received",
        completed: true
      },
      {
        id: "note-1", 
        type: "log_note",
        title: "Updated lead notes",
        description: "Added follow-up sequence details to lead profile",
        completed: true
      }
    ]
  }
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
        isUser 
          ? "bg-gradient-to-br from-[var(--rivor-indigo)] to-[var(--rivor-teal)]"
          : "bg-gradient-to-br from-[var(--rivor-teal)] to-[var(--rivor-aqua)]"
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div className={`flex-1 space-y-2 ${isUser ? "text-right" : ""}`}>
        <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
          isUser 
            ? "bg-gradient-to-br from-[var(--rivor-indigo)] to-[var(--rivor-teal)] text-white ml-auto"
            : "bg-[var(--muted)] text-[var(--foreground)]"
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {message.sources && message.sources.length > 0 && (
          <div className={`text-xs space-y-1 ${isUser ? "text-right" : ""}`}>
            <div className="text-[var(--muted-foreground)]">Sources used:</div>
            {message.sources.map((source, index) => (
              <Badge key={index} variant="outline" className="text-xs mr-1">
                <ExternalLink className="h-3 w-3 mr-1" />
                {source}
              </Badge>
            ))}
          </div>
        )}
        
        {message.actions && message.actions.length > 0 && (
          <div className={`space-y-2 ${isUser ? "text-right" : ""}`}>
            {message.actions.map((action) => (
              <Card key={action.id} className="inline-block max-w-sm">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded ${
                      action.completed ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {action.type === "draft_email" && <Mail className="h-3 w-3" />}
                      {action.type === "create_task" && <CheckCircle className="h-3 w-3" />}
                      {action.type === "schedule_meeting" && <Calendar className="h-3 w-3" />}
                      {action.type === "log_note" && <FileText className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{action.title}</span>
                        {action.completed && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            ✓ Done
                          </Badge>
                        )}
                      </div>
                      {action.description && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          {action.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className={`text-xs text-[var(--muted-foreground)] ${isUser ? "text-right" : ""}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect,
  onNewChat 
}: { 
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const contextColors = {
    email: "bg-blue-100 text-blue-700",
    lead: "bg-green-100 text-green-700", 
    contact: "bg-purple-100 text-purple-700",
    general: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="w-80 border-r border-[var(--border)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">AI Assistant</h2>
          <Button variant="ghost" size="icon" onClick={onNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <Input placeholder="Search conversations..." className="pl-9" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={`p-4 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--muted)] transition-colors ${
              selectedId === conversation.id ? "bg-[var(--muted)]" : ""
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm line-clamp-2">{conversation.title}</h3>
                <span className="text-xs text-[var(--muted-foreground)] ml-2">
                  {formatTime(conversation.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                {conversation.lastMessage}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {conversation.context && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${contextColors[conversation.context]}`}
                    >
                      {conversation.context}
                    </Badge>
                  )}
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {conversation.messageCount} messages
                  </span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [contextEnabled, setContextEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: newMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I understand your request. Let me help you with that. Based on the context from your recent activities, I can provide you with relevant assistance.",
        timestamp: new Date(),
        sources: contextEnabled ? ["Recent email threads", "Pipeline data", "Contact information"] : undefined,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleNewChat = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-56px)]">
        <ConversationList 
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
          onNewChat={handleNewChat}
        />
        
        <div className="flex-1 flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--rivor-teal)] to-[var(--rivor-aqua)] rounded-full flex items-center justify-center text-white mx-auto">
                  <Bot className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">AI Assistant</h2>
                  <p className="text-[var(--muted-foreground)] mb-6">
                    Get help with emails, lead management, scheduling, and more. 
                    I can access your recent data to provide contextual assistance.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-left">
                  <Card className="p-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Draft Emails</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Create personalized email drafts and responses
                    </p>
                  </Card>
                  
                  <Card className="p-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Lead Insights</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Get suggestions for lead qualification and follow-ups
                    </p>
                  </Card>
                  
                  <Card className="p-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Schedule Meetings</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Propose meeting times and create calendar events
                    </p>
                  </Card>
                  
                  <Card className="p-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Strategy Tips</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Get advice on sales strategy and pipeline optimization
                    </p>
                  </Card>
                </div>
                
                <Button variant="brand" onClick={handleNewChat}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{selectedConv?.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <span>{messages.length} messages</span>
                      {selectedConv?.context && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedConv.context} context
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Chat Settings</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Context Awareness</div>
                              <div className="text-sm text-[var(--muted-foreground)]">
                                Allow AI to access recent emails, leads, and calendar data
                              </div>
                            </div>
                            <Button
                              variant={contextEnabled ? "default" : "outline"}
                              size="sm"
                              onClick={() => setContextEnabled(!contextEnabled)}
                            >
                              {contextEnabled ? "On" : "Off"}
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="font-medium">Privacy Settings</div>
                            <div className="text-sm text-[var(--muted-foreground)]">
                              Summaries are stored, not raw message bodies, unless you explicitly enable full storage.
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Clear Context
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export Chat
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Rename Chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--rivor-teal)] to-[var(--rivor-aqua)] flex items-center justify-center text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-[var(--muted)] p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[var(--border)]">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask me anything about your leads, emails, or schedule..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    variant="brand" 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>AI context: {contextEnabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
