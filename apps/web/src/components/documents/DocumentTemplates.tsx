"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Copy, 
  Trash2, 
  Search, 
  Filter,
  Home,
  DollarSign,
  AlertTriangle,
  Handshake,
  Building,
  FileCheck,
  Eye,
  Download,
  Settings,
  Tag,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'listing' | 'purchase' | 'disclosure' | 'agreement' | 'marketing' | 'legal' | 'other';
  content: string;
  mergeFields: string[];
  isActive: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentTemplatesProps {
  onSelectTemplate?: (template: DocumentTemplate) => void;
  onCreateDocument?: (templateId: string) => void;
  className?: string;
}

const CATEGORY_ICONS = {
  listing: <Home className="h-4 w-4" />,
  purchase: <DollarSign className="h-4 w-4" />,
  disclosure: <AlertTriangle className="h-4 w-4" />,
  agreement: <Handshake className="h-4 w-4" />,
  marketing: <Building className="h-4 w-4" />,
  legal: <FileCheck className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />
};

const CATEGORY_COLORS = {
  listing: 'bg-blue-100 text-blue-700 border-blue-200',
  purchase: 'bg-green-100 text-green-700 border-green-200',
  disclosure: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  agreement: 'bg-purple-100 text-purple-700 border-purple-200',
  marketing: 'bg-orange-100 text-orange-700 border-orange-200',
  legal: 'bg-red-100 text-red-700 border-red-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function DocumentTemplates({ 
  onSelectTemplate, 
  onCreateDocument, 
  className = '' 
}: DocumentTemplatesProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form state for creating/editing templates
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other' as DocumentTemplate['category'],
    content: '',
    isActive: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/documents/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/documents/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates(prev => [newTemplate, ...prev]);
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const response = await fetch(`/api/documents/templates/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedTemplate = await response.json();
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
        setEditingTemplate(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/documents/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: DocumentTemplate) => {
    const duplicatedTemplate = {
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      content: template.content,
      isActive: true
    };

    try {
      const response = await fetch('/api/documents/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedTemplate)
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates(prev => [newTemplate, ...prev]);
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'other',
      content: '',
      isActive: true
    });
  };

  const openEditModal = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      isActive: template.isActive
    });
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'listing', label: 'Listing Documents' },
    { value: 'purchase', label: 'Purchase Agreements' },
    { value: 'disclosure', label: 'Disclosures' },
    { value: 'agreement', label: 'Agreements' },
    { value: 'marketing', label: 'Marketing Materials' },
    { value: 'legal', label: 'Legal Documents' },
    { value: 'other', label: 'Other' }
  ];

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
            Document Templates
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your document templates and create new documents
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <TemplateModal
              isEdit={false}
              formData={formData}
              setFormData={setFormData}
              onSave={handleCreateTemplate}
              onCancel={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            />
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No templates found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first document template to get started'
            }
          </p>
          {(!searchQuery && selectedCategory === 'all') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
        )}>
          <AnimatePresence>
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TemplateCard
                  template={template}
                  viewMode={viewMode}
                  onSelect={() => onSelectTemplate?.(template)}
                  onCreateDocument={() => onCreateDocument?.(template.id)}
                  onEdit={() => openEditModal(template)}
                  onDuplicate={() => handleDuplicateTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <TemplateModal
            isEdit={true}
            formData={formData}
            setFormData={setFormData}
            onSave={handleUpdateTemplate}
            onCancel={() => {
              setEditingTemplate(null);
              resetForm();
            }}
          />
        </Dialog>
      )}
    </div>
  );
}

function TemplateCard({ 
  template, 
  viewMode, 
  onSelect, 
  onCreateDocument, 
  onEdit, 
  onDuplicate, 
  onDelete 
}: {
  template: DocumentTemplate;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onCreateDocument: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className={cn(
                "p-2 rounded-lg border",
                CATEGORY_COLORS[template.category]
              )}>
                {CATEGORY_ICONS[template.category]}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">
                    {template.name}
                  </h3>
                  {!template.isActive && (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Used {template.usageCount} times</span>
                  <span>•</span>
                  <span>Updated {template.updatedAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onCreateDocument}>
                Use Template
              </Button>
              <TemplateActions
                onView={onSelect}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={cn(
            "p-2 rounded-lg border mb-3",
            CATEGORY_COLORS[template.category]
          )}>
            {CATEGORY_ICONS[template.category]}
          </div>
          <TemplateActions
            onView={onSelect}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {!template.isActive && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {template.description}
          </p>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Used {template.usageCount} times</span>
            <span>{template.mergeFields.length} fields</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onCreateDocument} className="flex-1">
              Use Template
            </Button>
            <Button size="sm" variant="outline" onClick={onSelect}>
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateActions({ onView, onEdit, onDuplicate, onDelete }: {
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button size="sm" variant="ghost" onClick={onView}>
        <Eye className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onEdit}>
        <Edit3 className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDuplicate}>
        <Copy className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:text-red-700">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function TemplateModal({ 
  isEdit, 
  formData, 
  setFormData, 
  onSave, 
  onCancel 
}: {
  isEdit: boolean;
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter template name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter template description"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listing">Listing Documents</SelectItem>
                <SelectItem value="purchase">Purchase Agreements</SelectItem>
                <SelectItem value="disclosure">Disclosures</SelectItem>
                <SelectItem value="agreement">Agreements</SelectItem>
                <SelectItem value="marketing">Marketing Materials</SelectItem>
                <SelectItem value="legal">Legal Documents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="content">Template Content</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Enter template content with merge fields like {{contact.name}}, {{deal.propertyAddress}}, etc."
            rows={12}
            className="font-mono text-sm"
          />
          <div className="mt-2 text-xs text-slate-500">
            Use merge fields: {`{{contact.name}}, {{contact.email}}, {{deal.propertyAddress}}, {{deal.propertyValue}}, {{agent.name}}, {{date}}`}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>
          {isEdit ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </DialogContent>
  );
}