"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  User,
  Mail,
  Calendar,
  CheckSquare,
  FileText,
  Home,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { internalFetch } from '@/lib/internal-url';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  icon: string;
  href: string;
  metadata?: any;
  relevanceScore?: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_CATEGORIES = [
  { id: 'all', label: 'All Results', icon: Search },
  { id: 'contacts', label: 'Contacts', icon: User },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'documents', label: 'Documents', icon: FileText }
];

const AI_SUGGESTIONS = [
  "emails about property showings",
  "hot leads from this week", 
  "emails about pricing inquiries",
  "showing request emails",
  "buyer lead emails",
  "seller lead emails",
  "contract emails",
  "follow up emails"
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState(AI_SUGGESTIONS);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      const recent = localStorage.getItem('recentSearches');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, activeCategory]);

  const performSearch = async (query: string) => {
    if (query.length < 2) return;

    setLoading(true);
    try {
      const searchPromises = [];
      
      // Smart search logic: determine intent based on query content
      const lowerQuery = query.toLowerCase();
      const isEmailSpecific = /email|mail|message|inbox|thread|reply/.test(lowerQuery);
      const isCalendarSpecific = /calendar|event|meeting|appointment|schedule/.test(lowerQuery);
      const isPipelineSpecific = /pipeline|deal|client|sale|contract/.test(lowerQuery);
      const isContactSpecific = /contact|person|people|phone|address/.test(lowerQuery);
      
      // If query mentions emails specifically, prioritize email search
      if (isEmailSpecific && activeCategory === 'all') {
        setActiveCategory('emails');
      }
      
      if (activeCategory === 'all' || activeCategory === 'contacts') {
        // Only search contacts if not email-specific or if contacts category is selected
        if (!isEmailSpecific || activeCategory === 'contacts') {
          searchPromises.push(
            internalFetch(`/api/contacts?search=${encodeURIComponent(query)}&limit=5`)
              .then(res => res.ok ? res.json() : { contacts: [] })
              .then(data => data.contacts?.map((contact: any) => ({
                id: `contact-${contact.id}`,
                title: contact.name || contact.email,
                subtitle: `${contact.email} • ${contact.phone || 'No phone'}`,
                type: 'contact',
                icon: 'User',
                href: `/app/contacts?id=${contact.id}`,
                metadata: contact,
                relevanceScore: calculateRelevance(query, contact.name + ' ' + contact.email)
              })) || [])
              .catch(() => [])
          );
        }
      }

      if (activeCategory === 'all' || activeCategory === 'emails') {
        searchPromises.push(
          internalFetch(`/api/inbox/threads?search=${encodeURIComponent(query)}&limit=10`)
            .then(res => res.ok ? res.json() : { threads: [] })
            .then(data => data.threads?.map((thread: any) => ({
              id: `email-${thread.id}`,
              title: thread.subject || 'No Subject',
              subtitle: `From: ${thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Unknown'} • ${new Date(thread.lastMessageAt).toLocaleDateString()}${thread.aiAnalysis?.category ? ` • ${thread.aiAnalysis.category.replace('_', ' ').toUpperCase()}` : ''}`,
              type: 'email',
              icon: 'Mail',
              href: `/app/inbox?thread=${thread.id}`,
              metadata: thread,
              relevanceScore: calculateEmailRelevance(query, thread)
            })) || [])
            .catch(() => [])
        );
      }

      if (activeCategory === 'all' || activeCategory === 'pipeline') {
        // Only search pipeline if not email-specific or if pipeline category is selected
        if (!isEmailSpecific || activeCategory === 'pipeline') {
          searchPromises.push(
            internalFetch(`/api/pipeline/deals?search=${encodeURIComponent(query)}&limit=5`)
              .then(res => res.ok ? res.json() : { deals: [] })
              .then(data => data.deals?.map((deal: any) => ({
                id: `deal-${deal.id}`,
                title: deal.title || deal.clientName,
                subtitle: `${deal.value ? `$${deal.value.toLocaleString()}` : ''} • ${deal.stage || 'Unknown stage'}`,
                type: 'pipeline',
                icon: 'TrendingUp',
                href: `/app/pipeline?deal=${deal.id}`,
                metadata: deal,
                relevanceScore: calculateRelevance(query, deal.title + ' ' + deal.clientName)
              })) || [])
              .catch(() => [])
          );
        }
      }

      // Only search calendar if specifically requested or if calendar category is selected
      if ((activeCategory === 'calendar') || (activeCategory === 'all' && isCalendarSpecific)) {
        searchPromises.push(
          internalFetch(`/api/calendar/events?search=${encodeURIComponent(query)}&limit=5`)
            .then(res => res.ok ? res.json() : { events: [] })
            .then(data => data.events?.map((event: any) => ({
              id: `event-${event.id}`,
              title: event.title || event.summary,
              subtitle: `${new Date(event.start).toLocaleDateString()} at ${new Date(event.start).toLocaleTimeString()}`,
              type: 'calendar',
              icon: 'Calendar',
              href: `/app/calendar?event=${event.id}`,
              metadata: event,
              relevanceScore: calculateRelevance(query, event.title + ' ' + event.description)
            })) || [])
            .catch(() => [])
        );
      }

      const results = await Promise.all(searchPromises);
      const allResults = results.flat().sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
      setSearchResults(allResults.slice(0, 20));
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateRelevance = (query: string, text: string): number => {
    if (!text) return 0;
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();
    
    // Exact match gets highest score
    if (lowerText.includes(lowerQuery)) {
      return lowerText.indexOf(lowerQuery) === 0 ? 100 : 80;
    }
    
    // Word matches
    const queryWords = lowerQuery.split(' ');
    const textWords = lowerText.split(' ');
    let score = 0;
    
    queryWords.forEach(qWord => {
      textWords.forEach(tWord => {
        if (tWord.includes(qWord)) {
          score += 10;
        }
      });
    });
    
    return Math.min(score, 90);
  };

  const calculateEmailRelevance = (query: string, thread: any): number => {
    const lowerQuery = query.toLowerCase();
    let score = 0;
    
    // Subject line match (high priority)
    if (thread.subject && thread.subject.toLowerCase().includes(lowerQuery)) {
      score += thread.subject.toLowerCase().indexOf(lowerQuery) === 0 ? 100 : 80;
    }
    
    // AI category match (very high priority for specific searches)
    if (thread.aiAnalysis?.category) {
      const categoryText = thread.aiAnalysis.category.replace('_', ' ');
      if (categoryText.toLowerCase().includes(lowerQuery)) {
        score += 90;
      }
      
      // Smart matching for real estate terms
      if (/showing|property|house|home|listing|tour|viewing/i.test(lowerQuery) && 
          thread.aiAnalysis.category === 'showing_request') {
        score += 95;
      }
      if (/lead|hot|buyer|seller|prospect/i.test(lowerQuery) && 
          ['hot_lead', 'buyer_lead', 'seller_lead'].includes(thread.aiAnalysis.category)) {
        score += 95;
      }
      if (/price|cost|value|budget|offer/i.test(lowerQuery) && 
          thread.aiAnalysis.category === 'price_inquiry') {
        score += 95;
      }
    }
    
    // AI analysis summary match
    if (thread.aiAnalysis?.keyEntities?.summary && 
        thread.aiAnalysis.keyEntities.summary.toLowerCase().includes(lowerQuery)) {
      score += 70;
    }
    
    // Participant match
    if (thread.participants) {
      thread.participants.forEach((participant: any) => {
        if (participant.name && participant.name.toLowerCase().includes(lowerQuery)) {
          score += 60;
        }
        if (participant.email && participant.email.toLowerCase().includes(lowerQuery)) {
          score += 50;
        }
      });
    }
    
    // AI entities match
    if (thread.aiAnalysis?.keyEntities) {
      const entities = thread.aiAnalysis.keyEntities;
      ['people', 'properties', 'amounts', 'dates'].forEach(entityType => {
        if (entities[entityType] && Array.isArray(entities[entityType])) {
          entities[entityType].forEach((entity: string) => {
            if (entity.toLowerCase().includes(lowerQuery)) {
              score += 40;
            }
          });
        }
      });
    }
    
    return Math.min(score, 100);
  };

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(searchQuery);
    router.push(result.href);
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      User, Mail, TrendingUp, Calendar, CheckSquare, FileText, Home, Search
    };
    return icons[iconName] || Search;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-3xl mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 20 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 p-6 border-b border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <Search className="h-5 w-5 text-white/60" />
              <input
                type="text"
                placeholder="Search everything across your CRM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-white/50 text-lg font-medium border-none outline-none"
                autoFocus
              />
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10">
            {SEARCH_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className={`text-xs ${
                  activeCategory === category.id
                    ? 'bg-white/20 text-white border-white/30'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <category.icon className="h-3 w-3 mr-1" />
                {category.label}
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="p-4">
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-white/80 mb-3">
                      Found {searchResults.length} results for "{searchQuery}"
                    </div>
                    {searchResults.map((result) => {
                      const IconComponent = getIconComponent(result.icon);
                      return (
                        <motion.div
                          key={result.id}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-all group"
                          onClick={() => handleResultClick(result)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <IconComponent className="h-4 w-4 text-white/70" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate">{result.title}</div>
                            <div className="text-white/60 text-sm truncate">{result.subtitle}</div>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-white/10 text-white/70 border-white/20">
                            {result.type}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white/70 transition-colors" />
                        </motion.div>
                      );
                    })}
                  </div>
                ) : !loading && (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-white/30 mx-auto mb-3" />
                    <div className="text-white/60">No results found for "{searchQuery}"</div>
                    <div className="text-white/40 text-sm mt-1">Try different keywords or check spelling</div>
                  </div>
                )}
              </div>
            )}

            {/* AI Suggestions & Recent Searches */}
            {searchQuery.length < 2 && (
              <div className="p-4 space-y-6">
                {/* AI Suggestions */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <div className="text-sm font-medium text-white/80">AI Suggestions</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all group flex items-center justify-between"
                        onClick={() => handleSuggestionClick(suggestion)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-white/70 text-sm">{suggestion}</span>
                        <ArrowRight className="h-3 w-3 text-white/40 group-hover:text-white/70 transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-white/60" />
                      <div className="text-sm font-medium text-white/80">Recent Searches</div>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer group"
                          onClick={() => setSearchQuery(search)}
                        >
                          <Clock className="h-3 w-3 text-white/40" />
                          <span className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
                            {search}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div>
                  <div className="text-sm font-medium text-white/80 mb-3">Quick Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      className="justify-start text-white/60 hover:text-white hover:bg-white/10 p-3"
                      onClick={() => router.push('/app/inbox')}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      View Inbox
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-white/60 hover:text-white hover:bg-white/10 p-3"
                      onClick={() => router.push('/app/pipeline')}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Pipeline
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}