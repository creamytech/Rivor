"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus, X } from 'lucide-react';
import { useToast } from '@/components/river/RiverToast';

interface ComposeEmailModalProps {
  trigger?: React.ReactNode;
  threadId?: string; // For replies
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onEmailSent?: (result: any) => void;
}

export default function ComposeEmailModal({
  trigger,
  threadId,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = '',
  onEmailSent
}: ComposeEmailModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: defaultTo,
    cc: '',
    bcc: '',
    subject: defaultSubject,
    body: defaultBody
  });
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          threadId,
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
        setOpen(false);
        setFormData({ to: '', cc: '', bcc: '', subject: '', body: '' });
        onEmailSent?.(result);
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
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {threadId ? 'Reply to Email' : 'Compose New Email'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* To Field */}
          <div className="space-y-2">
            <label htmlFor="to" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              To *
            </label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </div>

          {/* CC Field */}
          <div className="space-y-2">
            <label htmlFor="cc" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              CC
            </label>
            <Input
              id="cc"
              type="email"
              value={formData.cc}
              onChange={(e) => handleInputChange('cc', e.target.value)}
              placeholder="cc@example.com"
            />
          </div>

          {/* BCC Field */}
          <div className="space-y-2">
            <label htmlFor="bcc" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              BCC
            </label>
            <Input
              id="bcc"
              type="email"
              value={formData.bcc}
              onChange={(e) => handleInputChange('bcc', e.target.value)}
              placeholder="bcc@example.com"
            />
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Subject *
            </label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Email subject"
              required
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <label htmlFor="body" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Message *
            </label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder="Write your message here..."
              className="min-h-[200px]"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
