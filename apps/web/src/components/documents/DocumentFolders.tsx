"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Folder, 
  FolderOpen, 
  FolderPlus, 
  FileText, 
  MoreHorizontal,
  Edit3,
  Trash2,
  Move,
  Archive,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  Home,
  Building,
  Users,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  linkedDealId?: string;
  linkedContactId?: string;
  color?: string;
  isArchived: boolean;
  documentCount: number;
  subfolders: DocumentFolder[];
  createdAt: Date;
  updatedAt: Date;
}

interface Document {
  id: string;
  name: string;
  status: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentFoldersProps {
  selectedFolderId?: string;
  onSelectFolder?: (folderId: string | null) => void;
  onSelectDocument?: (documentId: string) => void;
  className?: string;
}

const FOLDER_COLORS = [
  { value: 'blue', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'green', class: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'purple', class: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'orange', class: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'red', class: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'gray', class: 'bg-gray-100 text-gray-700 border-gray-200' }
];

export default function DocumentFolders({ 
  selectedFolderId, 
  onSelectFolder, 
  onSelectDocument,
  className = '' 
}: DocumentFoldersProps) {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);

  // Form state for creating/editing folders
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    linkedDealId: '',
    linkedContactId: '',
    color: 'blue'
  });

  useEffect(() => {
    fetchFolders();
    fetchDocuments();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/documents/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(buildFolderTree(data.folders || []));
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const buildFolderTree = (flatFolders: any[]): DocumentFolder[] => {
    const folderMap = new Map();
    const rootFolders: DocumentFolder[] = [];

    // First pass: create folder objects
    flatFolders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        subfolders: [],
        documentCount: 0
      });
    });

    // Second pass: build tree structure
    flatFolders.forEach(folder => {
      const folderObj = folderMap.get(folder.id);
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).subfolders.push(folderObj);
      } else {
        rootFolders.push(folderObj);
      }
    });

    return rootFolders;
  };

  const handleCreateFolder = async () => {
    try {
      const response = await fetch('/api/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchFolders();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder) return;

    try {
      const response = await fetch(`/api/documents/folders/${editingFolder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchFolders();
        setEditingFolder(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? All documents will be moved to the root level.')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/folders/${folderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchFolders();
        await fetchDocuments();
        if (selectedFolderId === folderId) {
          onSelectFolder?.(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      parentId: '',
      linkedDealId: '',
      linkedContactId: '',
      color: 'blue'
    });
  };

  const openEditModal = (folder: DocumentFolder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      parentId: folder.parentId || '',
      linkedDealId: folder.linkedDealId || '',
      linkedContactId: folder.linkedContactId || '',
      color: folder.color || 'blue'
    });
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getDocumentsInFolder = (folderId: string | null) => {
    return documents.filter(doc => doc.folderId === folderId);
  };

  const filteredDocuments = getDocumentsInFolder(selectedFolderId || null).filter(doc =>
    !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      {/* Folder Tree */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Folders</CardTitle>
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <FolderModal
                  isEdit={false}
                  formData={formData}
                  setFormData={setFormData}
                  folders={folders}
                  onSave={handleCreateFolder}
                  onCancel={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                />
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {/* Root Level */}
              <FolderItem
                folder={null}
                isSelected={selectedFolderId === null}
                onClick={() => onSelectFolder?.(null)}
                documentCount={getDocumentsInFolder(null).length}
              />
              
              {/* Folder Tree */}
              {folders.map(folder => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  level={0}
                  isExpanded={expandedFolders.has(folder.id)}
                  isSelected={selectedFolderId === folder.id}
                  onToggle={() => toggleFolder(folder.id)}
                  onSelect={() => onSelectFolder?.(folder.id)}
                  onEdit={() => openEditModal(folder)}
                  onDelete={() => handleDeleteFolder(folder.id)}
                  getDocumentCount={getDocumentsInFolder}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Documents
                {selectedFolderId && (
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    in selected folder
                  </span>
                )}
              </CardTitle>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No documents found
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : selectedFolderId 
                      ? 'This folder is empty' 
                      : 'Create your first document to get started'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map(document => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    onClick={() => onSelectDocument?.(document.id)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {document.name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {document.status} • {document.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Folder Modal */}
      {editingFolder && (
        <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
          <FolderModal
            isEdit={true}
            formData={formData}
            setFormData={setFormData}
            folders={folders}
            onSave={handleUpdateFolder}
            onCancel={() => {
              setEditingFolder(null);
              resetForm();
            }}
          />
        </Dialog>
      )}
    </div>
  );
}

function FolderItem({ 
  folder, 
  isSelected, 
  onClick, 
  documentCount 
}: { 
  folder: DocumentFolder | null; 
  isSelected: boolean; 
  onClick: () => void; 
  documentCount: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
        isSelected 
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100" 
          : "hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
      onClick={onClick}
    >
      <Home className="h-4 w-4" />
      <span className="flex-1 font-medium">All Documents</span>
      <span className="text-xs text-slate-500">{documentCount}</span>
    </div>
  );
}

function FolderTreeItem({ 
  folder, 
  level, 
  isExpanded, 
  isSelected,
  onToggle, 
  onSelect, 
  onEdit, 
  onDelete,
  getDocumentCount 
}: {
  folder: DocumentFolder;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDocumentCount: (folderId: string) => Document[];
}) {
  const hasSubfolders = folder.subfolders.length > 0;
  const documentCount = getDocumentCount(folder.id).length;
  const colorClass = FOLDER_COLORS.find(c => c.value === folder.color)?.class || FOLDER_COLORS[0].class;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors group",
          isSelected 
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100" 
            : "hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasSubfolders ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="w-4" />
        )}
        
        <div 
          className="flex items-center gap-2 flex-1"
          onClick={onSelect}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4" />
          ) : (
            <Folder className="h-4 w-4" />
          )}
          <span className="font-medium">{folder.name}</span>
          {folder.color && (
            <div className={cn("w-2 h-2 rounded-full", colorClass)} />
          )}
        </div>
        
        <span className="text-xs text-slate-500 mr-2">{documentCount}</span>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Subfolders */}
      <AnimatePresence>
        {isExpanded && hasSubfolders && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {folder.subfolders.map(subfolder => (
              <FolderTreeItem
                key={subfolder.id}
                folder={subfolder}
                level={level + 1}
                isExpanded={false} // Simplified for now
                isSelected={false}
                onToggle={() => {}}
                onSelect={() => onSelect()}
                onEdit={onEdit}
                onDelete={onDelete}
                getDocumentCount={getDocumentCount}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FolderModal({ 
  isEdit, 
  formData, 
  setFormData, 
  folders,
  onSave, 
  onCancel 
}: {
  isEdit: boolean;
  formData: any;
  setFormData: (data: any) => void;
  folders: DocumentFolder[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const flattenFolders = (folders: DocumentFolder[], level = 0): Array<{ folder: DocumentFolder; level: number }> => {
    const result: Array<{ folder: DocumentFolder; level: number }> = [];
    folders.forEach(folder => {
      result.push({ folder, level });
      if (folder.subfolders.length > 0) {
        result.push(...flattenFolders(folder.subfolders, level + 1));
      }
    });
    return result;
  };

  const flatFolders = flattenFolders(folders);

  return (
    <DialogContent className="max-w-md glass-modal">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? 'Edit Folder' : 'Create New Folder'}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Folder Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter folder name"
          />
        </div>
        
        <div>
          <Label htmlFor="parent">Parent Folder (Optional)</Label>
          <select
            id="parent"
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            className="w-full p-2 border border-slate-200 rounded-md"
          >
            <option value="">No parent (root level)</option>
            {flatFolders.map(({ folder, level }) => (
              <option key={folder.id} value={folder.id}>
                {'  '.repeat(level)}{folder.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="color">Color</Label>
          <div className="flex items-center gap-2 mt-1">
            {FOLDER_COLORS.map(color => (
              <button
                key={color.value}
                type="button"
                className={cn(
                  "w-6 h-6 rounded border-2",
                  color.class,
                  formData.color === color.value 
                    ? "ring-2 ring-blue-500" 
                    : "hover:ring-2 hover:ring-slate-300"
                )}
                onClick={() => setFormData({ ...formData, color: color.value })}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>
          {isEdit ? 'Update Folder' : 'Create Folder'}
        </Button>
      </div>
    </DialogContent>
  );
}