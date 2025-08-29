"use client";
import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus, X, Bot, Sparkles, Calendar, Building2, FileText, Target, Clock, Zap, Palette, Copy, RefreshCw, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/river/RiverToast';
import { internalFetch } from '@/lib/internal-url';

interface ComposeEmailModalProps {
  trigger?: React.ReactNode;
  threadId?: string; // For replies
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onEmailSent?: (result: any) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Real estate specific props
  propertyInfo?: {
    address?: string;
    price?: number;
    propertyType?: string;
    mlsId?: string;
  };
  emailType?: 'follow_up' | 'property_info' | 'showing_request' | 'market_update' | 'general';
  contactInfo?: {
    name?: string;
    clientType?: 'buyer' | 'seller' | 'investor';
    preferences?: any;
  };
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  file?: File;
  url?: string;
}

export default function ComposeEmailModal({
  trigger,
  threadId,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = '',
  onEmailSent,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  propertyInfo,
  emailType = 'general',
  contactInfo
}: ComposeEmailModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [formData, setFormData] = useState({
    to: defaultTo,
    cc: '',
    bcc: '',
    subject: defaultSubject,
    body: defaultBody,
    priority: 'normal' as 'high' | 'normal' | 'low',
    scheduleFor: '',
    includePropertyAttachment: false,
    followUpDate: ''
  });
  
  const realEstateTemplates = {
    follow_up: {
      subject: 'Following up on your real estate inquiry',
      body: `Hi {{name}},\n\nI wanted to follow up on your recent inquiry about {{property_address}}. I have some exciting updates and additional properties that might interest you.\n\nWould you be available for a quick call this week to discuss your needs in more detail?\n\nBest regards,\n{{agent_name}}`
    },
    property_info: {
      subject: 'Property Information - {{property_address}}',
      body: `Hi {{name}},\n\nThank you for your interest in {{property_address}}. I'm excited to share the details of this {{property_type}} priced at {{property_price}}.\n\nProperty Highlights:\n• {{property_type}} in {{location}}\n• Listed at {{property_price}}\n• MLS ID: {{mls_id}}\n\nI've attached the property details and would love to schedule a showing. When would be convenient for you?\n\nBest regards,\n{{agent_name}}`
    },
    showing_request: {
      subject: 'Schedule Your Property Showing - {{property_address}}',
      body: `Hi {{name}},\n\nI'd be happy to arrange a showing for {{property_address}}. This {{property_type}} has been getting great interest, so I'd recommend scheduling soon.\n\nI have availability:\n• Tomorrow at 2:00 PM\n• Thursday at 10:00 AM\n• Saturday at 1:00 PM\n\nWhich time works best for you? Or let me know your preferred times and I'll coordinate.\n\nLooking forward to showing you this property!\n\n{{agent_name}}`
    },
    market_update: {
      subject: 'Market Update for {{location}} - {{month}} {{year}}',
      body: `Hi {{name}},\n\nI hope this message finds you well. I wanted to share some important market updates for {{location}} that may impact your real estate decisions.\n\nKey Market Highlights:\n• Average home price: {{avg_price}}\n• Properties sold this month: {{properties_sold}}\n• Average days on market: {{avg_days}}\n• Market trend: {{trend}}\n\nI'd be happy to discuss how these trends affect your buying/selling strategy. Would you like to schedule a call?\n\nBest regards,\n{{agent_name}}`
    }
  };
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await internalFetch('/api/inbox/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          body: formData.body,
          threadId,
          type: threadId ? 'reply' : 'new'
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
        setFormData({ 
          to: '', 
          cc: '', 
          bcc: '', 
          subject: '', 
          body: '',
          priority: 'normal' as 'high' | 'normal' | 'low',
          scheduleFor: '',
          includePropertyAttachment: false,
          followUpDate: ''
        });
        setAttachments([]);
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAttachmentUpload = async (file: File): Promise<string> => {
    const newAttachment: Attachment = {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      file: file
    };
    
    setAttachments(prev => [...prev, newAttachment]);
    
    // In a real implementation, you'd upload to a server and return the URL
    return Promise.resolve(`/uploads/${file.name}`);
  };
  
  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };
  
  const handleBodyChange = (content: string) => {
    setFormData(prev => ({ ...prev, body: content }));
  };
  
  const applyTemplate = (templateKey: string) => {
    const template = realEstateTemplates[templateKey as keyof typeof realEstateTemplates];
    if (template) {
      const personalizedSubject = template.subject
        .replace('{{property_address}}', propertyInfo?.address || '[Property Address]')
        .replace('{{location}}', '[Location]')
        .replace('{{month}}', new Date().toLocaleString('default', { month: 'long' }))
        .replace('{{year}}', new Date().getFullYear().toString());
        
      const personalizedBody = template.body
        .replace(/{{name}}/g, contactInfo?.name || '[Client Name]')
        .replace(/{{property_address}}/g, propertyInfo?.address || '[Property Address]')
        .replace(/{{property_type}}/g, propertyInfo?.propertyType || '[Property Type]')
        .replace(/{{property_price}}/g, propertyInfo?.price ? `$${propertyInfo.price.toLocaleString()}` : '[Price]')
        .replace(/{{mls_id}}/g, propertyInfo?.mlsId || '[MLS ID]')
        .replace(/{{agent_name}}/g, '[Your Name]')
        .replace(/{{location}}/g, '[Location]')
        .replace(/{{avg_price}}/g, '[Average Price]')
        .replace(/{{properties_sold}}/g, '[Properties Sold]')
        .replace(/{{avg_days}}/g, '[Average Days]')
        .replace(/{{trend}}/g, '[Market Trend]');
        
      setFormData(prev => ({
        ...prev,
        subject: personalizedSubject,
        body: personalizedBody
      }));
      setSelectedTemplate(templateKey);
    }
  };
  
  const generateAISuggestions = async () => {
    setShowAIAssist(true);
    // Mock AI suggestions - in real implementation, this would call an AI service
    const suggestions = [
      'Mention current market conditions to create urgency',
      'Include a specific call-to-action with time slots',
      'Add value proposition about your expertise',
      'Reference their specific property preferences',
      'Include social proof or recent success stories'
    ];
    setAiSuggestions(suggestions);
  };
  
  const enhanceWithAI = async () => {
    // Mock AI enhancement - in real implementation, this would enhance the email content
    const enhanced = formData.body + '\n\nP.S. Based on current market trends, properties in this area are moving quickly. I\'d recommend scheduling a viewing soon to secure your preferred time slot.';
    setFormData(prev => ({ ...prev, body: enhanced }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent 
        className="max-w-4xl max-h-[90vh] glass-modal rounded-xl overflow-hidden"
        data-glass-theme="black"
        style={{ 
          background: 'rgba(0, 0, 0, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(32px) saturate(1.4) brightness(0.85)'
        }}
      >
        <DialogHeader className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold" style={{ color: 'var(--glass-text)' }}>
                {threadId ? 'Reply to Email' : 'Compose New Email'}
              </DialogTitle>
              <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                {threadId ? 'Send a reply to this conversation' : 'Create and send a new email'}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Real Estate Email Type Selector */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 flex-1">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Email Type:</span>
              <select 
                value={emailType}
                className="text-sm bg-transparent border-none outline-none"
                disabled
              >
                <option value="general">General</option>
                <option value="follow_up">Follow-up</option>
                <option value="property_info">Property Information</option>
                <option value="showing_request">Showing Request</option>
                <option value="market_update">Market Update</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Templates
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={generateAISuggestions}
              >
                <Bot className="h-4 w-4 mr-1" />
                AI Assist
              </Button>
            </div>
          </div>
          
          {/* Property Context (if available) */}
          {propertyInfo && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Property Context</span>
              </div>
              <div className="text-sm space-y-1">
                <div><strong>Address:</strong> {propertyInfo.address}</div>
                {propertyInfo.price && <div><strong>Price:</strong> ${propertyInfo.price.toLocaleString()}</div>}
                {propertyInfo.propertyType && <div><strong>Type:</strong> {propertyInfo.propertyType}</div>}
                {propertyInfo.mlsId && <div><strong>MLS ID:</strong> {propertyInfo.mlsId}</div>}
              </div>
            </div>
          )}
          
          {/* Templates Panel */}
          {showTemplates && (
            <div className="p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Real Estate Email Templates
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(realEstateTemplates).map(([key, template]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={selectedTemplate === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyTemplate(key)}
                    className="text-xs justify-start"
                  >
                    {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* AI Suggestions Panel */}
          {showAIAssist && aiSuggestions.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Writing Suggestions
              </h4>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="text-sm p-2 bg-background/50 rounded border">
                    💡 {suggestion}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={enhanceWithAI}
                  className="w-full mt-2"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Enhance Email with AI
                </Button>
              </div>
            </div>
          )}
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
            <div className="relative">
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Email subject"
                required
              />
              {selectedTemplate && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Badge variant="secondary" className="text-xs">
                    Template: {selectedTemplate.replace('_', ' ')}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* Email Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select 
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Follow-up Date
              </label>
              <Input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Rich Text Editor Body Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Message *
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const enhanced = formData.body + '<p><br/>[Property details and market insights will be automatically included]</p>';
                    handleBodyChange(enhanced);
                  }}
                  className="text-xs"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Add Property Context
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const withScheduling = formData.body + '<p><br/>I have the following time slots available for a showing:</p><ul><li>[Time Option 1]</li><li>[Time Option 2]</li><li>[Time Option 3]</li></ul><p>Which works best for you?</p>';
                    handleBodyChange(withScheduling);
                  }}
                  className="text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Add Scheduling
                </Button>
              </div>
            </div>
            <div className="border border-input rounded-lg overflow-hidden bg-background">
              {/* Simple Toolbar */}
              <div className="border-b p-2 bg-muted/30">
                <div className="flex items-center gap-1">
                  <div className="text-xs text-muted-foreground px-2">
                    Enhanced rich text editor - basic formatting available
                  </div>
                  
                  <div className="ml-auto flex items-center gap-1">
                    {/* File Attachments */}
                    <div className="relative">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files) return;
                          for (const file of Array.from(files)) {
                            try {
                              await handleAttachmentUpload(file);
                            } catch (error) {
                              console.error('Failed to upload file:', error);
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Content */}
              <Textarea 
                value={formData.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Write your personalized message here..."
                className="min-h-[200px] border-0 resize-none focus:ring-0 focus:ring-offset-0"
              />

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="border-t p-3 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm font-medium">Attachments ({attachments.length})</span>
                  </div>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div 
                        key={attachment.id}
                        className="flex items-center justify-between p-2 bg-background border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{attachment.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div>Attachments: {attachments.length}</div>
              {propertyInfo && formData.includePropertyAttachment && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  Property attachment will be included
                </div>
              )}
            </div>
          </div>
          
          {/* Additional Options */}
          {propertyInfo && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeProperty"
                checked={formData.includePropertyAttachment}
                onChange={(e) => handleInputChange('includePropertyAttachment', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="includeProperty" className="text-sm">
                Include property information attachment
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Save as draft
                  console.log('Saving draft...');
                }}
                disabled={loading}
              >
                <FileText className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
              {formData.scheduleFor && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Scheduled for {formData.scheduleFor}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="min-w-[120px]">
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : formData.priority === 'high' ? 'Send Priority' : 'Send Email'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
