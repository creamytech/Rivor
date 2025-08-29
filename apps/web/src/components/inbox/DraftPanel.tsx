"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Edit, 
  Check, 
  X, 
  Send,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
  Eye,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { internalFetch } from '@/lib/internal-url';

interface Draft {
  id: string;
  emailId: string;
  threadId: string;
  suggestedContent: string;
  confidenceScore: number;
  category: string;
  status: 'draft' | 'pending' | 'approved' | 'declined' | 'sent';
  createdAt: string;
  updatedAt: string;
  metadata: any;
  originalEmail: {
    subject: string;
    from: string;
    sentAt: string;
    snippet: string;
  };
  analysis: any;
}

interface DraftPanelProps {
  theme: string;
  refreshTrigger?: number; // When this changes, trigger a refresh
  onDraftAction?: (action: string, draftId: string) => void;
}

export function DraftPanel({ theme, refreshTrigger, onDraftAction }: DraftPanelProps) {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch drafts
  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await internalFetch('/api/inbox/drafts?status=draft&limit=20');
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      } else {
        console.error('Failed to fetch drafts:', response.status);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
    
    // Auto-refresh every 30 seconds to check for new auto-drafts
    const interval = setInterval(fetchDrafts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time refresh trigger effect
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 DraftPanel: Received refresh trigger, fetching drafts');
      fetchDrafts();
    }
  }, [refreshTrigger]);

  // Handle draft actions
  const handleDraftAction = async (action: 'approve' | 'edit' | 'decline' | 'send', draftId: string, content?: string) => {
    try {
      setActionLoading(`${action}-${draftId}`);
      
      const response = await internalFetch('/api/inbox/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          action,
          content
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (action === 'send' && result.sent) {
          toast({
            title: "Draft Sent!",
            description: "Your AI-generated reply has been sent successfully.",
          });
          
          // Remove sent draft from list
          setDrafts(prev => prev.filter(d => d.id !== draftId));
        } else if (action === 'decline') {
          toast({
            title: "Draft Declined",
            description: "The draft has been declined and removed.",
          });
          
          // Remove declined draft from list
          setDrafts(prev => prev.filter(d => d.id !== draftId));
        } else if (action === 'approve') {
          toast({
            title: "Draft Approved",
            description: "The draft is now ready to send.",
          });
          
          // Update draft status
          setDrafts(prev => prev.map(d => 
            d.id === draftId ? { ...d, status: 'approved' } : d
          ));
        } else if (action === 'edit') {
          toast({
            title: "Draft Updated",
            description: "Your changes have been saved.",
          });
          
          // Update draft content
          setDrafts(prev => prev.map(d => 
            d.id === draftId ? { ...d, suggestedContent: content || d.suggestedContent } : d
          ));
          
          setEditingDraft(null);
          setEditContent('');
        }

        // Call parent callback if provided
        onDraftAction?.(action, draftId);
      } else {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Action failed');
      }
    } catch (error) {
      console.error(`Draft ${action} error:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} draft`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Get category emoji and color
  const getCategoryEmoji = (category: string) => {
    switch (category?.replace('-auto-draft', '')) {
      case 'hot_lead': return '🔥';
      case 'showing_request': return '🏠';
      case 'buyer_lead': return '🛒';
      case 'seller_lead': return '💰';
      case 'price_inquiry': return '🧮';
      default: return '📧';
    }
  };

  const getCategoryColor = (category: string) => {
    const baseCategory = category?.replace('-auto-draft', '');
    switch (baseCategory) {
      case 'hot_lead': return 'bg-red-600/30 text-red-200 border-red-400/50';
      case 'showing_request': return 'bg-blue-600/30 text-blue-200 border-blue-400/50';
      case 'price_inquiry': return 'bg-green-600/30 text-green-200 border-green-400/50';
      case 'seller_lead': return 'bg-purple-600/30 text-purple-200 border-purple-400/50';
      case 'buyer_lead': return 'bg-orange-600/30 text-orange-200 border-orange-400/50';
      default: return 'bg-gray-600/30 text-gray-200 border-gray-400/50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className={`${theme === 'black' ? 'text-white/60' : 'text-gray-700'}`}>Loading drafts...</p>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bot className={`h-12 w-12 ${theme === 'black' ? 'text-white/40' : 'text-gray-600'} mx-auto mb-4`} />
        <h3 className={`text-lg font-medium ${theme === 'black' ? 'text-white/60' : 'text-gray-800'} mb-2`}>
          No Drafts Available
        </h3>
        <p className={`${theme === 'black' ? 'text-white/40' : 'text-gray-600'} text-sm`}>
          AI will automatically create drafts for high-priority emails like showing requests and hot leads.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col draft-panel-glass">
      {/* Enhanced Header with Glass Effect */}
      <motion.div 
        className={`p-4 border-b ${theme === 'black' ? 'border-white/10' : 'border-black/10'} flex items-center justify-between`}
        style={{
          background: 'var(--glass-gradient-glow)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 rounded-xl"
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'
            }}
            whileHover={{ scale: 1.05 }}
          >
            <Bot className="h-5 w-5 text-purple-400" />
          </motion.div>
          <div>
            <h3 className={`font-semibold ${theme === 'black' ? 'text-white' : 'text-gray-900'}`}>
              AI Drafts
            </h3>
            <motion.div 
              className="category-badge-glass px-2 py-1 rounded-full text-xs font-medium mt-1"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                color: theme === 'black' ? 'rgb(196, 181, 253)' : 'rgb(88, 28, 135)',
                boxShadow: '0 0 12px rgba(139, 92, 246, 0.2)'
              }}
              animate={{ scale: drafts.length > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 2, repeat: drafts.length > 0 ? Infinity : 0, repeatDelay: 3 }}
            >
              {drafts.length} Draft{drafts.length !== 1 ? 's' : ''}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Drafts List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {drafts.map((draft, index) => (
            <motion.div
              key={draft.id}
              className={`draft-item glass-hover-lift border-b ${theme === 'black' ? 'border-white/5' : 'border-black/5'} transition-all duration-300 relative overflow-hidden`}
              style={{
                background: 'var(--glass-surface-alpha)',
                border: '1px solid var(--glass-border-subtle)',
                backdropFilter: 'blur(8px) saturate(1.1)',
                WebkitBackdropFilter: 'blur(8px) saturate(1.1)'
              }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ 
                y: -2, 
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--glass-border-strong)',
                backdropFilter: 'blur(12px) saturate(1.2) brightness(1.1)',
                WebkitBackdropFilter: 'blur(12px) saturate(1.2) brightness(1.1)'
              }}
            >
              {/* Draft Header */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedDraft(expandedDraft === draft.id ? null : draft.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <motion.div 
                      className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 category-badge-glass ${
                        draft.category.includes('hot') ? 'category-badge-hot-lead' :
                        draft.category.includes('showing') ? 'category-badge-showing' :
                        draft.category.includes('buyer') ? 'category-badge-buyer-lead' :
                        draft.category.includes('seller') ? 'category-badge-seller-lead' :
                        'category-badge-glass'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      animate={{ 
                        boxShadow: draft.confidenceScore > 0.8 ? 
                          ['0 0 8px rgba(34, 197, 94, 0.3)', '0 0 12px rgba(34, 197, 94, 0.5)', '0 0 8px rgba(34, 197, 94, 0.3)'] : 
                          '0 0 8px rgba(139, 92, 246, 0.2)'
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <span>{getCategoryEmoji(draft.category)}</span>
                      <span className="font-medium">{draft.category.replace('-auto-draft', '').replace('_', ' ').toUpperCase()}</span>
                    </motion.div>
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(draft.createdAt)}
                    </div>
                  </div>
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${
                      expandedDraft === draft.id ? 'rotate-90' : ''
                    } ${theme === 'black' ? 'text-white/40' : 'text-gray-600'}`} 
                  />
                </div>

                <div className={`text-sm font-medium ${theme === 'black' ? 'text-white' : 'text-gray-900'} mb-1 truncate`}>
                  Re: {draft.originalEmail.subject}
                </div>
                
                <div className={`text-xs ${theme === 'black' ? 'text-white/60' : 'text-gray-700'} truncate`}>
                  Reply to: {draft.originalEmail.from}
                </div>

                <div className={`text-xs mt-2 ${theme === 'black' ? 'text-white/50' : 'text-gray-600'} line-clamp-2`}>
                  {draft.suggestedContent.substring(0, 150)}...
                </div>
              </div>

              {/* Expanded Draft Content */}
              <AnimatePresence>
                {expandedDraft === draft.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={`px-4 pb-4 border-t ${theme === 'black' ? 'border-white/10' : 'border-black/10'}`}>
                      {/* Draft Content */}
                      <div className="mt-4">
                        {editingDraft === draft.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className={`w-full h-32 p-3 rounded border ${
                                theme === 'black' 
                                  ? 'bg-white/5 border-white/20 text-white' 
                                  : 'bg-gray-50 border-gray-300 text-gray-900'
                              } text-sm resize-none`}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingDraft(null);
                                  setEditContent('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="liquid"
                                size="sm"
                                onClick={() => handleDraftAction('edit', draft.id, editContent)}
                                disabled={actionLoading === `edit-${draft.id}`}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <motion.div 
                            className={`text-sm ${theme === 'black' ? 'text-white/90' : 'text-gray-900'} whitespace-pre-wrap p-3 rounded`}
                            style={{
                              background: 'var(--glass-surface-subtle)',
                              border: '1px solid var(--glass-border-subtle)',
                              backdropFilter: 'blur(6px)',
                              WebkitBackdropFilter: 'blur(6px)'
                            }}
                            whileHover={{
                              background: 'var(--glass-surface)',
                              borderColor: 'var(--glass-border)'
                            }}
                          >
                            {draft.suggestedContent}
                          </motion.div>
                        )}
                      </div>

                      {/* Enhanced Draft Actions with Glass Effects */}
                      {editingDraft !== draft.id && (
                        <motion.div 
                          className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <motion.div className="flex-1">
                            <Button
                              variant="liquid"
                              size="sm"
                              onClick={() => handleDraftAction('send', draft.id)}
                              disabled={actionLoading === `send-${draft.id}`}
                              className="w-full"
                              style={{
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 0.6))',
                                border: '1px solid rgba(34, 197, 94, 0.6)',
                                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)'
                              }}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send Now
                            </Button>
                          </motion.div>
                          
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingDraft(draft.id);
                                setEditContent(draft.suggestedContent);
                              }}
                              disabled={actionLoading?.includes(draft.id)}
                              className="category-badge-glass"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDraftAction('approve', draft.id)}
                              disabled={actionLoading === `approve-${draft.id}`}
                              className="category-badge-glass"
                              style={{
                                borderColor: 'rgba(34, 197, 94, 0.4)',
                                color: theme === 'black' ? 'rgb(134, 239, 172)' : 'rgb(21, 128, 61)'
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDraftAction('decline', draft.id)}
                              disabled={actionLoading === `decline-${draft.id}`}
                              className="category-badge-glass"
                              style={{
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                color: theme === 'black' ? 'rgb(252, 165, 165)' : 'rgb(153, 27, 27)'
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Enhanced Draft Metadata with Glass Effect */}
                      <motion.div 
                        className="mt-3 pt-3 border-t border-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className={`text-xs ${theme === 'black' ? 'text-white/40' : 'text-gray-600'} space-y-2`}>
                          <motion.div 
                            className="flex items-center gap-2"
                            whileHover={{ scale: 1.02 }}
                          >
                            <span>Confidence:</span>
                            <div 
                              className="flex-1 h-2 rounded-full overflow-hidden"
                              style={{
                                background: 'var(--glass-surface-subtle)',
                                border: '1px solid var(--glass-border-subtle)'
                              }}
                            >
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  background: draft.confidenceScore > 0.8 ? 
                                    'linear-gradient(90deg, rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 0.6))' :
                                    draft.confidenceScore > 0.6 ?
                                    'linear-gradient(90deg, rgba(251, 191, 36, 0.8), rgba(251, 191, 36, 0.6))' :
                                    'linear-gradient(90deg, rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 0.6))',
                                  boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)'
                                }}
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.round(draft.confidenceScore * 100)}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                              />
                            </div>
                            <span className="font-medium">{Math.round(draft.confidenceScore * 100)}%</span>
                          </motion.div>
                          {draft.analysis && (
                            <motion.div 
                              className="flex items-center gap-2"
                              whileHover={{ scale: 1.02 }}
                            >
                              <span>Lead Score:</span>
                              <div 
                                className="flex-1 h-2 rounded-full overflow-hidden"
                                style={{
                                  background: 'var(--glass-surface-subtle)',
                                  border: '1px solid var(--glass-border-subtle)'
                                }}
                              >
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{
                                    background: draft.analysis.leadScore >= 80 ? 
                                      'linear-gradient(90deg, rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 0.6))' :
                                      draft.analysis.leadScore >= 60 ?
                                      'linear-gradient(90deg, rgba(251, 191, 36, 0.8), rgba(251, 191, 36, 0.6))' :
                                      'linear-gradient(90deg, rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 0.6))',
                                    boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)'
                                  }}
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${draft.analysis.leadScore}%` }}
                                  transition={{ duration: 1, delay: 0.7 }}
                                />
                              </div>
                              <span className="font-medium">{draft.analysis.leadScore}/100</span>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}