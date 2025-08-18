"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Search,
  Eye,
  EyeOff,
  BarChart3,
  Activity,
  Users,
  Settings,
  GitBranch,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  pinned?: boolean;
}

interface CardManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenCards: string[];
  onToggleCard: (cardId: string) => void;
  cards: Record<string, CardConfig>;
}

const categoryIcons = {
  analytics: BarChart3,
  integrations: Settings,
  leads: Users,
  activity: Activity
};

const categoryColors = {
  analytics: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  integrations: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  leads: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  activity: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
};

export default function CardManagementDrawer({
  isOpen,
  onClose,
  hiddenCards,
  onToggleCard,
  cards
}: CardManagementDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(Object.values(cards).map(card => card.category));
    return Array.from(cats);
  }, [cards]);

  const filteredCards = useMemo(() => {
    return Object.values(cards).filter(card => {
      const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           card.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [cards, searchQuery, selectedCategory]);

  const handleToggleCard = (cardId: string) => {
    onToggleCard(cardId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-50 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Manage Cards
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Show or hide dashboard cards
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </Button>
                {categories.map(category => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons];
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="flex items-center gap-2"
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {filteredCards.map(card => {
                  const isHidden = hiddenCards.includes(card.id);
                  const Icon = categoryIcons[card.category as keyof typeof categoryIcons];
                  
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-lg border transition-all duration-200",
                        isHidden 
                          ? "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700" 
                          : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {Icon && <Icon className="h-4 w-4 text-slate-500" />}
                            <h3 className={cn(
                              "font-medium",
                              isHidden 
                                ? "text-slate-500 dark:text-slate-400" 
                                : "text-slate-900 dark:text-white"
                            )}>
                              {card.title}
                            </h3>
                            {card.pinned && (
                              <Badge variant="secondary" className="text-xs">
                                Pinned
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            "text-sm",
                            isHidden 
                              ? "text-slate-400 dark:text-slate-500" 
                              : "text-slate-600 dark:text-slate-400"
                          )}>
                            {card.description}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "mt-2 text-xs",
                              categoryColors[card.category as keyof typeof categoryColors]
                            )}
                          >
                            {card.category.charAt(0).toUpperCase() + card.category.slice(1)}
                          </Badge>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleCard(card.id)}
                          className={cn(
                            "h-8 w-8 transition-colors",
                            isHidden 
                              ? "text-slate-400 hover:text-slate-600" 
                              : "text-slate-600 hover:text-slate-800"
                          )}
                        >
                          {isHidden ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {filteredCards.length === 0 && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No cards found matching your search
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>
                  {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} shown
                </span>
                <span>
                  {hiddenCards.length} hidden
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
