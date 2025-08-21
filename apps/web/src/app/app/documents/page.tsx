"use client";

import { useState } from 'react';
import dynamic from "next/dynamic";
import { motion } from 'framer-motion';
import AppShell from '@/components/app/AppShell';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  FolderOpen, 
  Edit3,
  Settings
} from 'lucide-react';
import DocumentTemplates from '@/components/documents/DocumentTemplates';
import DocumentEditor from '@/components/documents/DocumentEditor';
import DocumentFolders from '@/components/documents/DocumentFolders';


export default function DocumentsPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [createFromTemplate, setCreateFromTemplate] = useState<string | null>(null);

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setActiveTab('editor');
    setCreateFromTemplate(template.id);
    setEditingDocument(null);
    setSelectedDocument(null);
  };

  const handleCreateFromTemplate = (templateId: string) => {
    setCreateFromTemplate(templateId);
    setActiveTab('editor');
    setEditingDocument(null);
    setSelectedDocument(null);
  };

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocument(documentId);
    setEditingDocument(documentId);
    setActiveTab('editor');
    setCreateFromTemplate(null);
  };

  const handleSaveDocument = (document: any) => {
    console.log('Document saved:', document);
    // Optionally refresh documents list or show success message
  };

  const handleCloseEditor = () => {
    setActiveTab('templates');
    setSelectedTemplate(null);
    setSelectedDocument(null);
    setEditingDocument(null);
    setCreateFromTemplate(null);
  };

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        <div className="min-h-screen" style={{ background: 'var(--glass-gradient)' }}>
          <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8" style={{ 
            backgroundColor: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
            backdropFilter: 'var(--glass-blur)'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Document Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Create, manage, and organize your real estate documents
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setActiveTab('editor');
                    setCreateFromTemplate(null);
                    setEditingDocument(null);
                    setSelectedDocument(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="folders" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              <DocumentTemplates
                onSelectTemplate={handleSelectTemplate}
                onCreateDocument={handleCreateFromTemplate}
              />
            </TabsContent>

            <TabsContent value="folders" className="space-y-6">
              <DocumentFolders
                onSelectDocument={handleSelectDocument}
              />
            </TabsContent>

            <TabsContent value="editor" className="space-y-6">
              {activeTab === 'editor' && (
                <DocumentEditor
                  documentId={editingDocument}
                  templateId={createFromTemplate}
                  onSave={handleSaveDocument}
                  onClose={handleCloseEditor}
                />
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <DocumentSettings />
            </TabsContent>
          </Tabs>
        </motion.div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}

function DocumentSettings() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DocuSign Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            DocuSign Integration
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  DocuSign Status
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Electronic signature integration
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Development Mode
                </span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              Configure DocuSign
            </Button>
          </div>
        </div>

        {/* PDF Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            PDF Generation
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Default Format
              </label>
              <select className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800">
                <option value="Letter">Letter (8.5" x 11")</option>
                <option value="A4">A4 (210mm x 297mm)</option>
                <option value="Legal">Legal (8.5" x 14")</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Default Margins
              </label>
              <select className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800">
                <option value="normal">Normal (1 inch)</option>
                <option value="narrow">Narrow (0.5 inch)</option>
                <option value="wide">Wide (1.5 inch)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="includeHeader" className="rounded" />
              <label htmlFor="includeHeader" className="text-sm text-slate-600 dark:text-slate-400">
                Include header and footer
              </label>
            </div>
          </div>
        </div>

        {/* Template Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Template Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="autoSave" className="rounded" defaultChecked />
              <label htmlFor="autoSave" className="text-sm text-slate-600 dark:text-slate-400">
                Auto-save templates while editing
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="versionHistory" className="rounded" defaultChecked />
              <label htmlFor="versionHistory" className="text-sm text-slate-600 dark:text-slate-400">
                Keep version history
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sharedTemplates" className="rounded" />
              <label htmlFor="sharedTemplates" className="text-sm text-slate-600 dark:text-slate-400">
                Share templates with team
              </label>
            </div>
          </div>
        </div>

        {/* Storage Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Storage & Backup
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Documents Stored
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Total documents in system
                </p>
              </div>
              <span className="text-lg font-bold text-blue-600">
                24
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Storage Used
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  PDF and document storage
                </p>
              </div>
              <span className="text-lg font-bold text-green-600">
                127 MB
              </span>
            </div>
            
            <Button variant="outline" className="w-full">
              Export All Documents
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}