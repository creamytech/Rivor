"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { internalFetch } from '@/lib/internal-url';

interface ManualDraftButtonProps {
  emailId: string;
  threadId: string;
  analysis?: any;
  onDraftCreated?: () => void;
}

export function ManualDraftButton({ emailId, threadId, analysis, onDraftCreated }: ManualDraftButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleTriggerDraft = async () => {
    try {
      setLoading(true);
      
      const response = await internalFetch('/api/debug/trigger-auto-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, threadId })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.drafted) {
          toast({
            title: "Draft Created!",
            description: `Auto-drafted reply for ${result.analysis.category}. Check the AI Drafts tab.`,
          });
          onDraftCreated?.();
        } else {
          toast({
            title: "No Draft Created",
            description: result.message || "Email doesn't meet auto-draft criteria",
            variant: "destructive",
          });
        }
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create draft');
      }
    } catch (error) {
      console.error('Manual draft error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create draft",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if no analysis yet
  if (!analysis) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTriggerDraft}
      disabled={loading}
      className="text-xs"
    >
      <Bot className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
      Create Draft
    </Button>
  );
}