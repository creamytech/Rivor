"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
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
  Search,
  Calendar,
  User,
  Tag,
  X,
  Filter,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFilters {
  query: string;
  from: string;
  to: string;
  subject: string;
  hasAttachments: boolean;
  isUnread: boolean;
  isStarred: boolean;
  dateFrom: string;
  dateTo: string;
  labels: string[];
}

interface AdvancedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (filters: SearchFilters) => void;
  savedSearches?: Array<{
    id: string;
    name: string;
    filters: SearchFilters;
  }>;
  onSaveSearch?: (name: string, filters: SearchFilters) => void;
}

export default function AdvancedSearchModal({
  open,
  onOpenChange,
  onSearch,
  savedSearches = [],
  onSaveSearch
}: AdvancedSearchModalProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    from: '',
    to: '',
    subject: '',
    hasAttachments: false,
    isUnread: false,
    isStarred: false,
    dateFrom: '',
    dateTo: '',
    labels: []
  });

  const [labelInput, setLabelInput] = useState('');
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
    onOpenChange(false);
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim(), filters);
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  const loadSavedSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters);
  };

  const addLabel = () => {
    if (labelInput.trim() && !filters.labels.includes(labelInput.trim())) {
      setFilters(prev => ({
        ...prev,
        labels: [...prev.labels, labelInput.trim()]
      }));
      setLabelInput('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      from: '',
      to: '',
      subject: '',
      hasAttachments: false,
      isUnread: false,
      isStarred: false,
      dateFrom: '',
      dateTo: '',
      labels: []
    });
  };

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-teal-500" />
            Advanced Search
          </DialogTitle>
          <DialogDescription>
            Search emails with advanced filters and criteria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                Saved Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((savedSearch) => (
                  <button
                    key={savedSearch.id}
                    onClick={() => loadSavedSearch(savedSearch.filters)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {savedSearch.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Basic Search */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Search Query
            </label>
            <Input
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              placeholder="Search in email content..."
              className="w-full"
            />
          </div>

          {/* From/To */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                From
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={filters.from}
                  onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                  placeholder="sender@example.com"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                To
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={filters.to}
                  onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="recipient@example.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Subject
            </label>
            <Input
              value={filters.subject}
              onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Search in subject line..."
              className="w-full"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasAttachments}
                onChange={(e) => setFilters(prev => ({ ...prev, hasAttachments: e.target.checked }))}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Has attachments</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isUnread}
                onChange={(e) => setFilters(prev => ({ ...prev, isUnread: e.target.checked }))}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Unread only</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isStarred}
                onChange={(e) => setFilters(prev => ({ ...prev, isStarred: e.target.checked }))}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Starred only</span>
            </label>
          </div>

          {/* Labels */}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
              Labels
            </label>
            
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="Add label..."
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLabel();
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={addLabel} size="sm">
                Add
              </Button>
            </div>

            {/* Label List */}
            {filters.labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.labels.map((label) => (
                  <motion.div
                    key={label}
                    initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="hover:bg-teal-200 dark:hover:bg-teal-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              
              {onSaveSearch && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSaveDialog(true)}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Save Search</DialogTitle>
                <DialogDescription>
                  Give your search a name to save it for later use.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                    Search Name
                  </label>
                  <Input
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    placeholder="e.g., Important emails from John"
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSearch}
                    disabled={!saveSearchName.trim()}
                    className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
                  >
                    Save Search
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
