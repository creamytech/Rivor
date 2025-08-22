"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/river/RiverToast';

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    to: string;
    subject: string;
    threadId?: string;
    body?: string;
  };
}

export default function ComposeModal({ open, onOpenChange, replyTo }: ComposeModalProps) {
  const [to, setTo] = useState(replyTo?.to || '');
  const [subject, setSubject] = useState(replyTo?.subject ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState(replyTo?.body || '');
  const [sending, setSending] = useState(false);
  const { addToast } = useToast();

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Information',
        description: 'Please fill in all required fields.'
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          body,
          threadId: replyTo?.threadId,
          isHtml: true
        }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Email Sent',
          description: 'Your email has been sent successfully.'
        });
        onOpenChange(false);
        // Reset form
        setTo('');
        setSubject('');
        setBody('');
      } else {
        addToast({
          type: 'error',
          title: 'Send Failed',
          description: result.error || 'Failed to send email.'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Send Failed',
        description: 'Failed to send email. Please try again.'
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onOpenChange(false);
      // Reset form
      setTo('');
      setSubject('');
      setBody('');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl mx-4 glass-modal glass-border-active glass-hover-glow rounded-lg shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {replyTo ? 'Reply' : 'Compose Email'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={sending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* To */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  To
                </label>
                <Input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  disabled={sending}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  disabled={sending}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message
                </label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={10}
                  disabled={sending}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={sending}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sending}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
