"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Star, 
  Archive, 
  Trash2, 
  Reply, 
  ReplyAll, 
  Forward, 
  Search,
  Filter,
  CheckCircle,
  Circle,
  Bot,
  Sparkles,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  Home,
  Users,
  Calendar,
  AlertCircle,
  Check,
  X,
  Edit,
  Send,
  Zap
} from 'lucide-react';

// Types for our AI-powered email system
interface AIAnalysis {
  category: 'hot-lead' | 'showing-request' | 'price-inquiry' | 'seller-lead' | 'buyer-lead' | 'follow-up' | 'contract' | 'marketing';
  priorityScore: number;
  leadScore: number;
  suggestedResponse?: string;
  confidenceScore: number;
  keyEntities: {
    addresses?: string[];
    priceRange?: string;
    contacts?: string[];
    propertyType?: string;
  };
  sentimentScore: number;
}

interface Email {
  id: string;
  threadId: string;
  from: { name: string; email: string };
  subject: string;
  preview: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  aiAnalysis?: AIAnalysis;
  hasAISuggestion?: boolean;
  attachments: number;
  labels: string[];
}

interface AISuggestion {
  id: string;
  emailId: string;
  suggestedContent: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  confidenceScore: number;
  category: string;
  userModifications?: string;
}

// Category styling configuration
const categoryConfig = {
  'hot-lead': { 
    color: '#ef4444', 
    label: 'Hot Lead', 
    icon: TrendingUp,
    glow: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
  },
  'showing-request': { 
    color: '#06b6d4', 
    label: 'Showing Request', 
    icon: Calendar,
    glow: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))'
  },
  'price-inquiry': { 
    color: '#eab308', 
    label: 'Price Inquiry', 
    icon: DollarSign,
    glow: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))'
  },
  'seller-lead': { 
    color: '#10b981', 
    label: 'Seller Lead', 
    icon: Home,
    glow: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
  },
  'buyer-lead': { 
    color: '#8b5cf6', 
    label: 'Buyer Lead', 
    icon: Users,
    glow: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))'
  },
  'follow-up': { 
    color: '#f59e0b', 
    label: 'Follow-up Required', 
    icon: Clock,
    glow: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))'
  },
  'contract': { 
    color: '#dc2626', 
    label: 'Contract/Legal', 
    icon: AlertCircle,
    glow: 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.6))'
  },
  'marketing': { 
    color: '#6b7280', 
    label: 'Marketing', 
    icon: Mail,
    glow: 'drop-shadow(0 0 8px rgba(107, 114, 128, 0.3))'
  }
};

export default function AIInboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [activeEmail, setActiveEmail] = useState<Email | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showAIApproval, setShowAIApproval] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<AISuggestion | null>(null);
  const [editingReply, setEditingReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // Mock data for demonstration - replace with actual API calls
  const mockEmails: Email[] = [
    {
      id: '1',
      threadId: 't1',
      from: { name: 'Sarah Johnson', email: 'sarah.j@gmail.com' },
      subject: 'Interested in 123 Oak Street listing',
      preview: 'Hi, I saw your listing for the beautiful home on Oak Street and would love to schedule a showing...',
      body: `Hi there,

I saw your listing for the beautiful 4-bedroom home at 123 Oak Street and I'm very interested. The photos look amazing and it seems perfect for my family.

Could we schedule a showing this weekend? I'm pre-approved for up to $850,000 and ready to move quickly on the right property.

My phone number is (555) 123-4567.

Thanks!
Sarah Johnson`,
      timestamp: new Date('2024-01-15T10:30:00'),
      isRead: false,
      isStarred: false,
      isArchived: false,
      hasAISuggestion: true,
      attachments: 0,
      labels: ['inbox'],
      aiAnalysis: {
        category: 'hot-lead',
        priorityScore: 95,
        leadScore: 88,
        confidenceScore: 0.92,
        keyEntities: {
          addresses: ['123 Oak Street'],
          priceRange: '$850,000',
          contacts: ['(555) 123-4567'],
          propertyType: '4-bedroom home'
        },
        sentimentScore: 0.85
      }
    },
    {
      id: '2', 
      threadId: 't2',
      from: { name: 'Michael Chen', email: 'm.chen@realestate.com' },
      subject: 'Price negotiation on Maple Ave property',
      preview: 'Following up on our discussion about the Maple Avenue listing. My clients are prepared to make an offer...',
      body: `Hello,

Following up on our discussion about the Maple Avenue listing. My clients have seen the property and are very interested.

They're prepared to make an offer of $720,000, which is $30,000 below asking. They can close within 30 days with cash.

Let me know your thoughts.

Best regards,
Michael Chen
Chen Realty Group`,
      timestamp: new Date('2024-01-15T09:15:00'),
      isRead: true,
      isStarred: true,
      isArchived: false,
      hasAISuggestion: true,
      attachments: 1,
      labels: ['inbox', 'negotiation'],
      aiAnalysis: {
        category: 'price-inquiry',
        priorityScore: 85,
        leadScore: 82,
        confidenceScore: 0.89,
        keyEntities: {
          addresses: ['Maple Avenue'],
          priceRange: '$720,000',
          contacts: [],
          propertyType: ''
        },
        sentimentScore: 0.72
      }
    },
    {
      id: '3',
      threadId: 't3', 
      from: { name: 'Jennifer Martinez', email: 'jmart.homes@gmail.com' },
      subject: 'Looking to sell my downtown condo',
      preview: 'I\'m thinking about selling my 2-bedroom condo in the downtown area. Can you help me with a market analysis...',
      body: `Hi,

I'm thinking about selling my 2-bedroom condo in the downtown area and I've heard great things about your services.

The unit is at 456 Main Street, Unit 12A. It's about 1,200 sq ft with updated kitchen and bathrooms. 

Can you help me with a market analysis and let me know what you think it might be worth in today's market?

I'd also love to know about your commission structure and marketing approach.

Thanks,
Jennifer Martinez
(555) 987-6543`,
      timestamp: new Date('2024-01-14T16:45:00'),
      isRead: false,
      isStarred: false,
      isArchived: false,
      hasAISuggestion: true,
      attachments: 0,
      labels: ['inbox'],
      aiAnalysis: {
        category: 'seller-lead',
        priorityScore: 78,
        leadScore: 85,
        confidenceScore: 0.94,
        keyEntities: {
          addresses: ['456 Main Street, Unit 12A'],
          priceRange: '',
          contacts: ['(555) 987-6543'],
          propertyType: '2-bedroom condo'
        },
        sentimentScore: 0.80
      }
    }
  ];

  const mockSuggestions: AISuggestion[] = [
    {
      id: 's1',
      emailId: '1',
      suggestedContent: `Hi Sarah,

Thank you for your interest in 123 Oak Street! I'd be delighted to show you this beautiful property.

I have availability this Saturday at 2 PM or Sunday at 10 AM for a private showing. Given your pre-approval amount and timeline, this home would be an excellent fit.

The property features:
- 4 spacious bedrooms
- Updated kitchen with granite countertops  
- Landscaped backyard perfect for families
- Top-rated school district
- Move-in ready condition

Would either time work for you? I can also answer any questions about the neighborhood or property details.

Looking forward to meeting you!

Best regards,
[Your Name]`,
      status: 'pending',
      confidenceScore: 0.91,
      category: 'showing-response'
    },
    {
      id: 's2', 
      emailId: '2',
      suggestedContent: `Hi Michael,

Thank you for the offer on the Maple Avenue property. I've discussed it with my seller and we appreciate your clients' interest.

While the offer of $720,000 shows serious intent, we're currently at $750,000 as our best price given:
- Recent comparable sales in the area
- The property's excellent condition
- High demand we've been seeing

Would your clients consider $740,000? This represents a $10,000 reduction from asking and reflects our motivation to work with qualified buyers.

Let me know your thoughts and we can discuss further.

Best regards,
[Your Name]`,
      status: 'pending',
      confidenceScore: 0.87,
      category: 'negotiation-response'
    }
  ];

  useEffect(() => {
    // Simulate loading emails with AI analysis
    const loadEmails = async () => {
      setLoading(true);
      // In real implementation, this would be API calls
      setTimeout(() => {
        setEmails(mockEmails);
        setAiSuggestions(mockSuggestions);
        setLoading(false);
      }, 1000);
    };

    loadEmails();
  }, []);

  const handleEmailSelect = (email: Email) => {
    setActiveEmail(email);
    if (!email.isRead) {
      // Mark as read
      setEmails(prev => 
        prev.map(e => e.id === email.id ? { ...e, isRead: true } : e)
      );
    }
  };

  const handleAISuggestionReview = (suggestion: AISuggestion) => {
    setCurrentSuggestion(suggestion);
    setReplyContent(suggestion.suggestedContent);
    setShowAIApproval(true);
  };

  const handleApproveSuggestion = () => {
    if (currentSuggestion) {
      // In real implementation, this would send the email
      console.log('Approving and sending:', replyContent);
      setShowAIApproval(false);
      setCurrentSuggestion(null);
    }
  };

  const handleRejectSuggestion = () => {
    setShowAIApproval(false); 
    setCurrentSuggestion(null);
  };

  const filteredEmails = emails.filter(email => {
    // Filter logic
    if (activeFilter === 'unread' && email.isRead) return false;
    if (activeFilter === 'starred' && !email.isStarred) return false;
    if (activeFilter === 'ai-suggestions' && !email.hasAISuggestion) return false;
    if (activeFilter !== 'all' && activeFilter !== 'unread' && activeFilter !== 'starred' && activeFilter !== 'ai-suggestions') {
      if (email.aiAnalysis?.category !== activeFilter) return false;
    }
    if (searchQuery) {
      return email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
             email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             email.preview.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getPriorityGlow = (score: number) => {
    if (score >= 90) return 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.8))';
    if (score >= 70) return 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))';
    return '';
  };

  return (
    <div className="h-full flex flex-col glass-theme-black overflow-hidden">
      {/* AI-Powered Header */}
      <motion.div 
        className="p-6 border-b border-white/10"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{
              background: 'rgba(139, 92, 246, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI-Powered Inbox</h1>
              <p className="text-sm text-white/60">Smart real estate email management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="liquid" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Insights
            </Button>
            <Button variant="liquid" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{
                backdropFilter: 'blur(20px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'All', icon: Mail },
              { key: 'unread', label: 'Unread', icon: Circle },
              { key: 'starred', label: 'Starred', icon: Star },
              { key: 'ai-suggestions', label: 'AI Suggestions', icon: Bot },
              { key: 'hot-lead', label: 'Hot Leads', icon: TrendingUp },
            ].map(filter => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "liquid" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key)}
                className="text-xs"
              >
                <filter.icon className="h-3 w-3 mr-1" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Inbox Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List Panel */}
        <motion.div 
          className="w-96 border-r border-white/10 flex flex-col"
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
          }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="p-4 border-b border-white/10">
            <div className="text-sm text-white/60">
              {filteredEmails.length} emails • {filteredEmails.filter(e => !e.isRead).length} unread
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-white/60">Analyzing emails with AI...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No emails found</p>
                </div>
              ) : (
                filteredEmails.map((email, index) => (
                  <motion.div
                    key={email.id}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all duration-300 hover:bg-white/5 ${
                      activeEmail?.id === email.id ? 'bg-white/10' : ''
                    }`}
                    onClick={() => handleEmailSelect(email)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      filter: email.aiAnalysis?.priorityScore ? getPriorityGlow(email.aiAnalysis.priorityScore) : ''
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* AI Priority Indicator */}
                      {email.aiAnalysis && (
                        <div className="mt-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              background: email.aiAnalysis.priorityScore >= 90 ? '#ef4444' : 
                                         email.aiAnalysis.priorityScore >= 70 ? '#f59e0b' : '#6b7280'
                            }}
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-white truncate">
                            {email.from.name}
                          </div>
                          <div className="flex items-center gap-1">
                            {email.hasAISuggestion && (
                              <Bot className="h-3 w-3 text-purple-400" />
                            )}
                            {email.isStarred && (
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            )}
                            {!email.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>

                        <div className="text-sm font-medium text-white/90 truncate mb-1">
                          {email.subject}
                        </div>

                        <div className="text-xs text-white/60 truncate mb-2">
                          {email.preview}
                        </div>

                        {/* AI Category Tag */}
                        {email.aiAnalysis && (
                          <div className="flex items-center justify-between">
                            <div 
                              className="px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1"
                              style={{
                                background: `${categoryConfig[email.aiAnalysis.category]?.color}20`,
                                color: categoryConfig[email.aiAnalysis.category]?.color,
                                border: `1px solid ${categoryConfig[email.aiAnalysis.category]?.color}40`
                              }}
                            >
                              {React.createElement(categoryConfig[email.aiAnalysis.category]?.icon || Mail, { 
                                className: "h-3 w-3" 
                              })}
                              {categoryConfig[email.aiAnalysis.category]?.label}
                            </div>
                            
                            <div className="text-xs text-white/40">
                              {new Date(email.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Email Detail Panel */}
        <motion.div 
          className="flex-1 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {activeEmail ? (
            <>
              {/* Email Header */}
              <div 
                className="p-6 border-b border-white/10"
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(20px) saturate(1.3)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-2">
                      {activeEmail.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div>From: {activeEmail.from.name} &lt;{activeEmail.from.email}&gt;</div>
                      <div>{new Date(activeEmail.timestamp).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="liquid" size="sm">
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm">
                      <Forward className="h-4 w-4 mr-1" />
                      Forward
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* AI Analysis Panel */}
                {activeEmail.aiAnalysis && (
                  <motion.div 
                    className="rounded-xl p-4 mb-4"
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      <span className="font-medium text-purple-300">AI Analysis</span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {activeEmail.aiAnalysis.priorityScore}
                        </div>
                        <div className="text-xs text-white/60">Priority Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {activeEmail.aiAnalysis.leadScore}
                        </div>
                        <div className="text-xs text-white/60">Lead Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {(activeEmail.aiAnalysis.confidenceScore * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-white/60">AI Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {(activeEmail.aiAnalysis.sentimentScore * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-white/60">Sentiment</div>
                      </div>
                    </div>

                    {/* Key Entities */}
                    {activeEmail.aiAnalysis.keyEntities && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {activeEmail.aiAnalysis.keyEntities.addresses && (
                          <div>
                            <div className="text-xs text-white/60 mb-1">Properties</div>
                            {activeEmail.aiAnalysis.keyEntities.addresses.map((addr, i) => (
                              <div key={i} className="flex items-center gap-1 text-sm text-white">
                                <MapPin className="h-3 w-3" />
                                {addr}
                              </div>
                            ))}
                          </div>
                        )}
                        {activeEmail.aiAnalysis.keyEntities.priceRange && (
                          <div>
                            <div className="text-xs text-white/60 mb-1">Price Range</div>
                            <div className="flex items-center gap-1 text-sm text-white">
                              <DollarSign className="h-3 w-3" />
                              {activeEmail.aiAnalysis.keyEntities.priceRange}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Suggestion Available */}
                    {activeEmail.hasAISuggestion && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <Button
                          variant="liquid"
                          size="sm"
                          onClick={() => {
                            const suggestion = aiSuggestions.find(s => s.emailId === activeEmail.id);
                            if (suggestion) handleAISuggestionReview(suggestion);
                          }}
                          className="w-full"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Review AI-Generated Response ({(aiSuggestions.find(s => s.emailId === activeEmail.id)?.confidenceScore || 0) * 100}% confidence)
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Email Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <motion.div 
                  className="prose prose-invert max-w-none"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="whitespace-pre-wrap text-white/90 leading-relaxed">
                    {activeEmail.body}
                  </div>
                </motion.div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white/60 mb-2">Select an email</h3>
                <p className="text-white/40">Choose an email from the list to view its content and AI analysis</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Reply Approval Modal */}
      <AnimatePresence>
        {showAIApproval && currentSuggestion && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl"
              style={{
                background: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(25px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(25px) saturate(1.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                      <Bot className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">AI-Generated Response</h3>
                      <p className="text-sm text-white/60">
                        Confidence: {(currentSuggestion.confidenceScore * 100).toFixed(0)}% • 
                        Category: {currentSuggestion.category}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectSuggestion}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Review and edit the AI-generated response:
                  </label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full h-64 p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    style={{
                      backdropFilter: 'blur(20px) saturate(1.3)',
                      WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
                    }}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex items-center justify-between">
                <div className="text-sm text-white/60">
                  This response was generated based on the email content and real estate best practices.
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRejectSuggestion}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="liquid"
                    onClick={handleApproveSuggestion}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Send Response
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}