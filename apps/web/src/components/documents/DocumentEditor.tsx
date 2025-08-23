"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Save, 
  FileDown, 
  Send, 
  Eye, 
  Code, 
  Tag, 
  User, 
  Building, 
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Zap,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentEditorProps {
  documentId?: string;
  templateId?: string;
  dealId?: string;
  contactId?: string;
  onSave?: (document: any) => void;
  onClose?: () => void;
  className?: string;
}

interface MergeField {
  key: string;
  label: string;
  category: 'contact' | 'deal' | 'agent' | 'other';
  example: string;
  required?: boolean;
}

const MERGE_FIELDS: MergeField[] = [
  // Contact fields
  { key: 'contact.name', label: 'Contact Name', category: 'contact', example: 'John Smith', required: true },
  { key: 'contact.email', label: 'Contact Email', category: 'contact', example: 'john@example.com' },
  { key: 'contact.phone', label: 'Contact Phone', category: 'contact', example: '(555) 123-4567' },
  { key: 'contact.company', label: 'Contact Company', category: 'contact', example: 'ABC Corp' },
  { key: 'contact.title', label: 'Contact Title', category: 'contact', example: 'CEO' },
  
  // Deal fields
  { key: 'deal.propertyAddress', label: 'Property Address', category: 'deal', example: '123 Main St, City, ST 12345' },
  { key: 'deal.propertyValue', label: 'Property Value', category: 'deal', example: '$450,000' },
  { key: 'deal.listingId', label: 'MLS/Listing ID', category: 'deal', example: 'MLS123456' },
  { key: 'deal.stage', label: 'Deal Stage', category: 'deal', example: 'Under Contract' },
  { key: 'deal.probability', label: 'Deal Probability', category: 'deal', example: '75%' },
  { key: 'deal.expectedCloseDate', label: 'Expected Close Date', category: 'deal', example: '12/15/2024' },
  
  // Agent fields
  { key: 'agent.name', label: 'Agent Name', category: 'agent', example: 'Sarah Johnson' },
  { key: 'agent.email', label: 'Agent Email', category: 'agent', example: 'sarah@realty.com' },
  { key: 'agent.phone', label: 'Agent Phone', category: 'agent', example: '(555) 987-6543' },
  
  // Other fields
  { key: 'date', label: 'Current Date', category: 'other', example: '11/20/2024' },
  { key: 'time', label: 'Current Time', category: 'other', example: '2:30 PM' },
];

const CATEGORY_ICONS = {
  contact: <User className="h-4 w-4" />,
  deal: <Building className="h-4 w-4" />,
  agent: <FileText className="h-4 w-4" />,
  other: <Calendar className="h-4 w-4" />
};

export default function DocumentEditor({ 
  documentId, 
  templateId, 
  dealId, 
  contactId, 
  onSave, 
  onClose,
  className = '' 
}: DocumentEditorProps) {
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showMergeFields, setShowMergeFields] = useState(false);
  const [mergeData, setMergeData] = useState<any>({});
  const [previewContent, setPreviewContent] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    status: 'draft' as 'draft' | 'generated' | 'sent' | 'signed' | 'completed',
    linkedDealId: dealId || '',
    linkedContactId: contactId || '',
    folderId: ''
  });

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    } else if (templateId) {
      loadTemplate();
    } else {
      setIsLoading(false);
    }
    
    fetchMergeData();
  }, [documentId, templateId, dealId, contactId]);

  useEffect(() => {
    if (formData.content && mergeData) {
      generatePreview();
    }
  }, [formData.content, mergeData]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
        setFormData({
          name: data.name,
          content: data.content,
          status: data.status,
          linkedDealId: data.linkedDealId || '',
          linkedContactId: data.linkedContactId || '',
          folderId: data.folderId || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = async () => {
    try {
      const response = await fetch(`/api/documents/templates/${templateId}`);
      if (response.ok) {
        const template = await response.json();
        setFormData(prev => ({
          ...prev,
          name: `New ${template.name}`,
          content: template.content
        }));
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMergeData = async () => {
    try {
      const params = new URLSearchParams();
      if (dealId) params.append('dealId', dealId);
      if (contactId) params.append('contactId', contactId);
      
      const response = await fetch(`/api/documents/merge-data?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMergeData(data);
      }
    } catch (error) {
      console.error('Failed to fetch merge data:', error);
    }
  };

  const generatePreview = () => {
    let content = formData.content;
    
    // Replace merge fields with actual data
    const mergeFieldRegex = /\{\{([^}]+)\}\}/g;
    content = content.replace(mergeFieldRegex, (match, fieldPath) => {
      const keys = fieldPath.split('.');
      let value = mergeData;
      
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined || value === null) {
          return `[${fieldPath}]`;
        }
      }
      
      // Format values
      if (fieldPath.includes('date') && value instanceof Date) {
        return new Date(value).toLocaleDateString();
      }
      if (fieldPath.includes('price') || fieldPath.includes('value') || fieldPath.includes('amount')) {
        return typeof value === 'number' ? 
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : 
          value;
      }
      
      return String(value);
    });
    
    setPreviewContent(content);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = documentId ? `/api/documents/${documentId}` : '/api/documents';
      const method = documentId ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedDocument = await response.json();
        setDocument(savedDocument);
        onSave?.(savedDocument);
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    setGenerationError(null);
    
    try {
      const response = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          name: formData.name,
          dealId: formData.linkedDealId,
          contactId: formData.linkedContactId
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.text();
        setGenerationError(error);
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setGenerationError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendForSignature = async () => {
    // TODO: Implement DocuSign integration
    console.log('Send for signature:', document);
  };

  const insertMergeField = (field: MergeField) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = formData.content;
    const newContent = content.substring(0, start) + `{{${field.key}}}` + content.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Set cursor position after inserted field
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + field.key.length + 4, start + field.key.length + 4);
    }, 0);
  };

  const getUsedMergeFields = () => {
    const mergeFieldRegex = /\{\{([^}]+)\}\}/g;
    const matches = [...formData.content.matchAll(mergeFieldRegex)];
    return matches.map(match => match[1]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {documentId ? 'Edit Document' : 'Create Document'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {documentId ? `Editing: ${document?.name}` : 'Create a new document from template or scratch'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
          >
            {viewMode === 'edit' ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </>
            ) : (
              <>
                <Code className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMergeFields(true)}
          >
            <Tag className="h-4 w-4 mr-2" />
            Merge Fields
          </Button>
          
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Document Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Document name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="status" className="text-xs">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="generated">Generated</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="w-full justify-start"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Document'}
              </Button>
              
              <Button 
                onClick={handleGeneratePDF} 
                disabled={isGeneratingPDF || !formData.content}
                variant="outline" 
                className="w-full justify-start"
                size="sm"
              >
                <FileDown className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
              </Button>
              
              <Button 
                onClick={handleSendForSignature}
                disabled={!document || formData.status === 'draft'}
                variant="outline" 
                className="w-full justify-start"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Send for Signature
              </Button>
              
              {generationError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  {generationError}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Used Merge Fields */}
          {getUsedMergeFields().length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Used Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {getUsedMergeFields().map((field, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            {viewMode === 'edit' ? (
              <CardContent className="p-0 h-full">
                <Textarea
                  ref={textareaRef}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your document content here. Use merge fields like {{contact.name}}, {{deal.propertyAddress}}, etc."
                  className="h-full border-0 rounded-lg resize-none font-mono text-sm"
                />
              </CardContent>
            ) : (
              <CardContent className="p-6 h-full overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{previewContent}</pre>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Merge Fields Modal */}
      <Dialog open={showMergeFields} onOpenChange={setShowMergeFields}>
        <DialogContent className="max-w-2xl glass-modal">
          <DialogHeader>
            <DialogTitle>Insert Merge Fields</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {Object.entries(
              MERGE_FIELDS.reduce((acc, field) => {
                if (!acc[field.category]) acc[field.category] = [];
                acc[field.category].push(field);
                return acc;
              }, {} as Record<string, MergeField[]>)
            ).map(([category, fields]) => (
              <div key={category}>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Fields
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fields.map((field) => (
                    <Button
                      key={field.key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertMergeField(field)}
                      className="justify-start h-auto p-3"
                    >
                      <div className="text-left">
                        <div className="font-medium text-xs">{field.label}</div>
                        <div className="text-xs text-slate-500">{`{{${field.key}}}`}</div>
                        <div className="text-xs text-slate-400 italic">{field.example}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowMergeFields(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}