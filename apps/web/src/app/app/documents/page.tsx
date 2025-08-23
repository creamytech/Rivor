"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/app/AppShell';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  FolderOpen, 
  Edit3,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Share2,
  Star,
  Trash2,
  Eye,
  Copy,
  FileCheck,
  FileX,
  Calendar,
  User,
  Clock,
  MoreHorizontal,
  Folder,
  File,
  Archive,
  Tag,
  CheckSquare,
  Sparkles,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'template' | 'contract' | 'listing';
  size: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  folder: string;
  status: 'draft' | 'pending' | 'signed' | 'completed' | 'archived';
  tags: string[];
  isStarred: boolean;
  isShared: boolean;
  description?: string;
  linkedContact?: string;
  linkedProperty?: string;
}

interface Folder {
  id: string;
  name: string;
  documentCount: number;
  color: string;
  icon: React.ReactNode;
}

export default function DocumentsPage() {
  const { theme } = useTheme();
  const { isMobile } = useMobileDetection();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type' | 'size'>('date');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch real documents from API
      const documentsResponse = await fetch('/api/documents');
      const foldersResponse = await fetch('/api/documents/folders');
      
      if (documentsResponse.ok && foldersResponse.ok) {
        const documentsData = await documentsResponse.json();
        const foldersData = await foldersResponse.json();
        
        setDocuments(documentsData.documents || []);
        setFolders(foldersData.folders || []);
      } else {
        console.error('Failed to fetch documents or folders');
        setDocuments([]);
        setFolders([]);
      }
      
      // Old mock data (kept as reference)
      /*const mockDocuments: Document[] = [
        {
          id: 'doc-1',
          name: 'Purchase Agreement - Johnson Property',
          type: 'contract',
          size: '2.4 MB',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          createdBy: 'John Smith',
          folder: 'contracts',
          status: 'pending',
          tags: ['residential', 'urgent'],
          isStarred: true,
          isShared: true,
          description: 'Purchase agreement for downtown residential property',
          linkedContact: 'Sarah Johnson',
          linkedProperty: '123 Main St'
        },
        {
          id: 'doc-2',
          name: 'Property Listing Template',
          type: 'template',
          size: '856 KB',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'Sarah Wilson',
          folder: 'templates',
          status: 'completed',
          tags: ['listing', 'template'],
          isStarred: false,
          isShared: true,
          description: 'Standard property listing template for residential properties'
        },
        {
          id: 'doc-3',
          name: 'Market Analysis Report Q4',
          type: 'pdf',
          size: '4.1 MB',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'Mike Chen',
          folder: 'reports',
          status: 'completed',
          tags: ['market-analysis', 'quarterly'],
          isStarred: false,
          isShared: false,
          description: 'Comprehensive market analysis for Q4 2024'
        },
        {
          id: 'doc-4',
          name: 'Commercial Lease Agreement',
          type: 'contract',
          size: '1.8 MB',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'John Smith',
          folder: 'contracts',
          status: 'signed',
          tags: ['commercial', 'lease'],
          isStarred: true,
          isShared: false,
          description: 'Commercial property lease for office space',
          linkedContact: 'Tech Corp Inc',
          linkedProperty: '456 Business Ave'
        }
      ];

      const mockFolders: Folder[] = [
        { id: 'all', name: 'All Documents', documentCount: mockDocuments.length, color: 'blue', icon: <FileText className="h-4 w-4" /> },
        { id: 'contracts', name: 'Contracts', documentCount: 12, color: 'green', icon: <FileCheck className="h-4 w-4" /> },
        { id: 'templates', name: 'Templates', documentCount: 8, color: 'purple', icon: <Copy className="h-4 w-4" /> },
        { id: 'listings', name: 'Listings', documentCount: 15, color: 'orange', icon: <Folder className="h-4 w-4" /> },
        { id: 'reports', name: 'Reports', documentCount: 6, color: 'red', icon: <TrendingUp className="h-4 w-4" /> },
        { id: 'archived', name: 'Archived', documentCount: 24, color: 'gray', icon: <Archive className="h-4 w-4" /> }
      ];

      */
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = selectedFolder === 'all' || doc.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'type':
        return a.type.localeCompare(b.type);
      case 'size':
        return parseFloat(a.size) - parseFloat(b.size);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'signed': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'archived': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'docx': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'template': return <Copy className="h-4 w-4 text-purple-500" />;
      case 'contract': return <FileCheck className="h-4 w-4 text-green-500" />;
      case 'listing': return <Folder className="h-4 w-4 text-orange-500" />;
      default: return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDocumentAction = (document: Document, action: string) => {
    switch (action) {
      case 'preview':
        setSelectedDocument(document);
        setShowPreview(true);
        break;
      case 'star':
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id ? { ...doc, isStarred: !doc.isStarred } : doc
        ));
        break;
      case 'share':
        console.log('Share document:', document.id);
        break;
      case 'download':
        console.log('Download document:', document.id);
        break;
      case 'delete':
        setDocuments(prev => prev.filter(doc => doc.id !== document.id));
        break;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        <div className="px-4 mt-4 mb-2 main-content-area">
          {/* Liquid Glass Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card glass-border-active mb-6"
            style={{ 
              backgroundColor: 'var(--glass-surface)', 
              color: 'var(--glass-text)',
              backdropFilter: 'var(--glass-blur)'
            }}
          >
            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'} mb-6`}>
                <div className="flex items-center gap-4">
                  <div className="glass-icon-container">
                    <FileText className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                  </div>
                  <div>
                    <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold glass-text-gradient`}>Documents</h1>
                    <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                      {isMobile ? 'Manage documents' : 'Manage contracts, templates, and real estate documents'}
                    </p>
                  </div>
                </div>
                
                <div className={`${isMobile ? 'flex flex-col gap-2 w-full' : 'flex items-center gap-3'}`}>
                  <Button 
                    variant="outline"
                    size="sm"
                    className={`glass-button-secondary ${isMobile ? 'w-full' : ''}`}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  <Button 
                    variant="liquid"
                    size={isMobile ? "default" : "lg"}
                    className={`glass-hover-glow ${isMobile ? 'w-full' : ''}`}
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    New Document
                  </Button>
                </div>
              </div>

              {/* Search and Controls */}
              <div className="flex items-center gap-4 mb-4">
                {/* Enhanced Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                         style={{ color: 'var(--glass-text-muted)' }} />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-16 glass-input"
                  />
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="glass-button-secondary">
                      <Filter className="h-4 w-4 mr-2" />
                      Sort: {sortBy}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass-dropdown">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy('date')}>Date Modified</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('name')}>Name</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('type')}>Type</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('size')}>Size</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Mode Toggle */}
                <div className="glass-pill-container">
                  <Button
                    variant={viewMode === 'grid' ? 'liquid' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="glass-pill-button"
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'liquid' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="glass-pill-button"
                  >
                    List
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar - Folders */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-3"
            >
              <div className="glass-card glass-border mb-6"
                   style={{ backgroundColor: 'var(--glass-surface)' }}>
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4 glass-text-gradient">Folders</h2>
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200',
                          'glass-button-hover',
                          selectedFolder === folder.id 
                            ? 'glass-button-active' 
                            : 'glass-button-secondary'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {folder.icon}
                          <span className="text-sm font-medium">{folder.name}</span>
                        </div>
                        <Badge variant="secondary" className="glass-category-pill">
                          {folder.documentCount}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="glass-card glass-border"
                   style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="glass-icon-container-small">
                      <Sparkles className="h-4 w-4" style={{ color: 'var(--glass-accent)' }} />
                    </div>
                    <span className="text-sm font-semibold glass-text-gradient">
                      Quick Actions
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="glass-suggestion-pill">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span>5 contracts pending review</span>
                    </div>
                    <div className="glass-suggestion-pill">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>3 templates need updating</span>
                    </div>
                    <div className="glass-suggestion-pill">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span>Auto-generate listing docs</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Content - Documents */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-9"
            >
              <div className="glass-card glass-border-active"
                   style={{ backgroundColor: 'var(--glass-surface)' }}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold glass-text-gradient">
                      {folders.find(f => f.id === selectedFolder)?.name || 'Documents'} 
                      <span className="text-sm font-normal ml-2" style={{ color: 'var(--glass-text-muted)' }}>
                        ({sortedDocuments.length} documents)
                      </span>
                    </h3>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="glass-spinner"></div>
                    </div>
                  ) : sortedDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="glass-icon-container mx-auto mb-4">
                        <FileText className="h-8 w-8" style={{ color: 'var(--glass-text-muted)' }} />
                      </div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--glass-text)' }}>
                        {searchQuery ? 'No documents found' : 'No documents yet'}
                      </h3>
                      <p className="text-sm mb-6" style={{ color: 'var(--glass-text-muted)' }}>
                        {searchQuery 
                          ? `No documents match "${searchQuery}". Try a different search term.`
                          : 'Create your first document to get started.'
                        }
                      </p>
                      {!searchQuery && (
                        <Button 
                          variant="liquid" 
                          onClick={() => setShowCreateModal(true)}
                          className="glass-hover-glow"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Document
                        </Button>
                      )}
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence>
                        {sortedDocuments.map((document, index) => (
                          <motion.div
                            key={document.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-document-card"
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3">
                                  {getTypeIcon(document.type)}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm leading-tight mb-1" 
                                        style={{ color: 'var(--glass-text)' }}>
                                      {document.name}
                                    </h4>
                                    <p className="text-xs mb-2" 
                                       style={{ color: 'var(--glass-text-muted)' }}>
                                      {document.size} • {formatDate(document.updatedAt)}
                                    </p>
                                  </div>
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="glass-button-small h-6 w-6 p-0">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="glass-dropdown">
                                    <DropdownMenuItem onClick={() => handleDocumentAction(document, 'preview')}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDocumentAction(document, 'download')}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDocumentAction(document, 'share')}>
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDocumentAction(document, 'delete')}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="flex items-center justify-between mb-3">
                                <Badge className={cn('text-xs', getStatusColor(document.status))}>
                                  {document.status}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {document.isStarred && (
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  )}
                                  {document.isShared && (
                                    <Share2 className="h-3 w-3 text-blue-500" />
                                  )}
                                </div>
                              </div>

                              {document.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {document.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="glass-category-pill text-xs"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                  {document.tags.length > 2 && (
                                    <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                      +{document.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-xs" 
                                   style={{ color: 'var(--glass-text-muted)' }}>
                                <User className="h-3 w-3" />
                                <span>{document.createdBy}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {sortedDocuments.map((document, index) => (
                          <motion.div
                            key={document.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.03 }}
                            className="glass-list-item"
                          >
                            <div className="flex items-center gap-4 p-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {getTypeIcon(document.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium truncate" 
                                        style={{ color: 'var(--glass-text)' }}>
                                      {document.name}
                                    </h4>
                                    {document.isStarred && (
                                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    )}
                                    {document.isShared && (
                                      <Share2 className="h-3 w-3 text-blue-500" />
                                    )}
                                  </div>
                                  <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                                    {document.description || 'No description'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <Badge className={cn('text-xs', getStatusColor(document.status))}>
                                  {document.status}
                                </Badge>
                                <span className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                                  {document.size}
                                </span>
                                <span className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                                  {formatDate(document.updatedAt)}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="glass-button-small">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="glass-dropdown">
                                    <DropdownMenuItem onClick={() => handleDocumentAction(document, 'preview')}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDocumentAction(document, 'download')}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDocumentAction(document, 'share')}>
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDocumentAction(document, 'delete')}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AppShell>

      {/* Create Document Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px] glass-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-500" />
              Create New Document
            </DialogTitle>
            <DialogDescription>
              Choose a document type to get started.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {[
              { type: 'contract', name: 'Contract', icon: FileCheck, color: 'green' },
              { type: 'template', name: 'Template', icon: Copy, color: 'purple' },
              { type: 'listing', name: 'Listing', icon: Folder, color: 'orange' },
              { type: 'pdf', name: 'Document', icon: FileText, color: 'red' }
            ].map((docType) => (
              <button
                key={docType.type}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-teal-500 transition-colors text-center"
                onClick={() => {
                  console.log('Create document type:', docType.type);
                  setShowCreateModal(false);
                }}
              >
                <docType.icon className={`h-8 w-8 mx-auto mb-2 text-${docType.color}-500`} />
                <span className="text-sm font-medium">{docType.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] glass-modal overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-500" />
              {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription>
              Document preview and details
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="py-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                {getTypeIcon(selectedDocument.type)}
                <div className="mt-4">
                  <p className="text-lg font-semibold mb-2">{selectedDocument.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {selectedDocument.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span>{selectedDocument.size}</span>
                    <span>•</span>
                    <span>{formatDate(selectedDocument.updatedAt)}</span>
                    <span>•</span>
                    <span>{selectedDocument.createdBy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}