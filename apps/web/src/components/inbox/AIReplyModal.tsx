"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Check,
  Edit3,
  X,
  Send,
  Sparkles,
  Clock,
  TrendingUp,
  MessageSquare,
  Copy,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIReply {
  id: string;
  suggestedContent: string;
  confidenceScore: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  createdAt: string;
}

interface EmailAnalysis {
  category: string;
  priorityScore: number;
  leadScore: number;
  confidenceScore: number;
  sentimentScore: number;
  keyEntities: any;
}

interface AIReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  reply: AIReply | null;
  analysis: EmailAnalysis | null;
  originalEmail: {
    subject: string;
    fromName: string;
    fromEmail: string;
    body: string;
  } | null;
  onApprove: (replyId: string, modifiedContent?: string) => Promise<void>;
  onReject: (replyId: string, reason?: string) => Promise<void>;
  onRegenerate: () => Promise<void>;
}

export function AIReplyModal({
  isOpen,
  onClose,
  reply,
  analysis,
  originalEmail,
  onApprove,
  onReject,
  onRegenerate
}: AIReplyModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reply) {
      setEditedContent(reply.suggestedContent);
      setIsEditing(false);
      setShowRejectForm(false);
      setRejectReason('');
    }
  }, [reply]);

  if (!reply || !originalEmail) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(reply.id, isEditing ? editedContent : undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(reply.id, rejectReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    setIsSubmitting(true);
    try {
      await onRegenerate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(isEditing ? editedContent : reply.suggestedContent);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCategoryDisplayName = (category: string) => {
    return category.replace('-response', '').replace('_', ' ').replace('-', ' ').split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle>AI-Generated Reply</DialogTitle>
                    <DialogDescription>
                      Review and approve the AI-generated response for {originalEmail.fromName}
                    </DialogDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', getConfidenceColor(reply.confidenceScore))}>
                    {Math.round(reply.confidenceScore * 100)}% confidence
                  </Badge>
                  {analysis && (
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryDisplayName(analysis.category)}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  {/* Original Email Context */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Original Email
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>From:</strong> {originalEmail.fromName} &lt;{originalEmail.fromEmail}&gt;</div>
                      <div><strong>Subject:</strong> {originalEmail.subject}</div>
                      <Separator className="my-2" />
                      <div className="text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {originalEmail.body}
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis Summary */}
                  {analysis && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        AI Analysis Summary
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {analysis.leadScore}
                          </div>
                          <div className="text-gray-600">Lead Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {analysis.priorityScore}
                          </div>
                          <div className="text-gray-600">Priority</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(analysis.sentimentScore * 100)}%
                          </div>
                          <div className="text-gray-600">Sentiment</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Reply Content */}
                  <div className="bg-white border rounded-lg">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Suggested Reply
                      </h4>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={copyToClipboard}
                                className="h-7 w-7 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy to clipboard</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(!isEditing)}
                          className="h-7 px-2"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          {isEditing ? 'Preview' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {isEditing ? (
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[200px] resize-none"
                          placeholder="Edit the AI-generated reply..."
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {isEditing ? editedContent : reply.suggestedContent}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reject Reason Form */}
                  <AnimatePresence>
                    {showRejectForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 rounded-lg p-4"
                      >
                        <h4 className="font-medium text-sm mb-2 text-red-800">
                          Why are you rejecting this reply?
                        </h4>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Optional: Provide feedback to improve future AI replies..."
                          className="bg-white"
                          rows={3}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>

            <DialogFooter className="border-t pt-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  Generated {new Date(reply.createdAt).toLocaleString()}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isSubmitting}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-2', isSubmitting && 'animate-spin')} />
                    Regenerate
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (showRejectForm) {
                        handleReject();
                      } else {
                        setShowRejectForm(true);
                      }
                    }}
                    disabled={isSubmitting}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {showRejectForm ? 'Confirm Reject' : 'Reject'}
                  </Button>
                  
                  <Button
                    onClick={handleApprove}
                    disabled={isSubmitting || (isEditing && !editedContent.trim())}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isEditing ? 'Approve & Send Edited' : 'Approve & Send'}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}