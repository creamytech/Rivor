"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Building2,
  User,
  DollarSign,
  Target,
  Tag,
  Mail,
  Save,
  X,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from './PipelineBoard';

interface CreateLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage?: string | null;
  threadData?: {
    threadId: string;
    subject: string;
    contact: string;
    email: string;
    company?: string;
  };
  onLeadCreated?: (lead: Lead) => void;
}

export default function CreateLeadModal({
  open,
  onOpenChange,
  defaultStage,
  threadData,
  onLeadCreated
}: CreateLeadModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    contact: '',
    email: '',
    value: '',
    probability: '50',
    stage: defaultStage || 'prospect',
    priority: 'medium' as 'low' | 'medium' | 'high',
    source: threadData ? 'email' : 'manual',
    description: '',
    tags: [] as string[]
  });
  
  const [tagInput, setTagInput] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch stages using tRPC
  const { data: stagesData } = trpc.pipelineStages.list.useQuery();
  const stages = stagesData || [];

  // Create lead mutation
  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: (newLead) => {
      if (onLeadCreated) {
        onLeadCreated(newLead);
      }
      onOpenChange(false);
      setCreating(false);
    },
    onError: (error) => {
      console.error('Failed to create lead:', error);
      setCreating(false);
    }
  });

  useEffect(() => {
    if (threadData) {
      setFormData(prev => ({
        ...prev,
        title: threadData.subject || 'Lead from Email',
        contact: threadData.contact,
        email: threadData.email,
        company: threadData.company || '',
        source: 'email'
      }));
    }
  }, [threadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const leadData = {
        title: formData.title,
        company: formData.company,
        contact: formData.contact,
        email: formData.email,
        value: parseFloat(formData.value) || 0,
        probabilityPercent: parseInt(formData.probability),
        stageId: formData.stage,
        priority: formData.priority,
        source: formData.source,
        description: formData.description,
        tags: formData.tags,
        threadId: threadData?.threadId
      };

      createLeadMutation.mutate(leadData);
    } catch (error) {
      console.error('Failed to create lead:', error);
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      contact: '',
      email: '',
      value: '',
      probability: '50',
      stage: defaultStage || 'prospect',
      priority: 'medium',
      source: threadData ? 'email' : 'manual',
      description: '',
      tags: []
    });
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto glass-modal glass-border-active glass-hover-glow">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-500" />
            {threadData ? 'Create Lead from Email' : 'Create New Lead'}
          </DialogTitle>
          <DialogDescription>
            {threadData 
              ? 'Convert this email conversation into a sales opportunity.'
              : 'Add a new lead to your sales pipeline.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Lead Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter lead title..."
              required
              className="w-full"
            />
          </div>

          {/* Company and Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                Company *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name..."
                  required
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                Contact Person *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={formData.contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="Contact name..."
                  required
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contact@company.com"
                className="pl-10"
              />
            </div>
          </div>

          {/* Value and Probability */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                Deal Value
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="0"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                Probability (%)
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData(prev => ({ ...prev, probability: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Stage and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                Pipeline Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                className={cn(
                  "w-full rounded-md border border-slate-300 dark:border-slate-600",
                  "bg-white dark:bg-slate-800 px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                )}
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  priority: e.target.value as 'low' | 'medium' | 'high' 
                }))}
                className={cn(
                  "w-full rounded-md border border-slate-300 dark:border-slate-600",
                  "bg-white dark:bg-slate-800 px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                )}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Lead description or notes..."
              rows={3}
              className={cn(
                "w-full rounded-md border border-slate-300 dark:border-slate-600",
                "bg-white dark:bg-slate-800 px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              )}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Tags
            </label>
            
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>

            {/* Tag List */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <motion.div
                    key={tag}
                    initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-teal-200 dark:hover:bg-teal-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Thread Link Info */}
          {threadData && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Mail className="h-4 w-4" />
                <span>This lead will be linked to the email thread: "{threadData.subject}"</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.title.trim() || !formData.company.trim() || !formData.contact.trim()}
              className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
            >
              {creating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 mr-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                  </motion.div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
