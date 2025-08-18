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
  minW: number;
  minH: number;
  defaultW: number;
  defaultH: number;
  pinned: boolean;
}

interface CardManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenCards: string[];
  onToggleCard: (cardId: string) => void;
  cards: Record<string, CardConfig>;
}

const categoryIcons = {
  overview: BarChart3,
  leads: Users,
  activity: Activity,
  system: Settings,
  pipeline: GitBranch,
  metrics: TrendingUp
};

const categoryColors = {
  overview: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  leads: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  activity: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  system: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  pipeline: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  metrics: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300'
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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(Object.values(cards).map(card => card.category)));
    return ['all', ...cats];
  }, [cards]);

  // Filter cards based on search and category
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
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Manage Cards
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add or hide dashboard cards
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

            {/* Search */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => {
                  const Icon = category === 'all' ? BarChart3 : categoryIcons[category as keyof typeof categoryIcons];
                  const isActive = selectedCategory === category;
                  
                  return (
                    <Button
                      key={category}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="flex items-center gap-2 h-8"
                    >
                      <Icon className="h-3 w-3" />
                      {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {filteredCards.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No cards found matching your search
                    </p>
                  </div>
                ) : (
                  filteredCards.map(card => {
                    const isHidden = hiddenCards.includes(card.id);
                    const Icon = categoryIcons[card.category as keyof typeof categoryIcons];
                    const categoryColor = categoryColors[card.category as keyof typeof categoryColors];
                    
                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 rounded-lg border transition-all duration-200",
                          isHidden 
                            ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" 
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              isHidden ? "bg-slate-200 dark:bg-slate-700" : "bg-blue-100 dark:bg-blue-900/20"
                            )}>
                              <Icon className={cn(
                                "h-4 w-4",
                                isHidden ? "text-slate-500 dark:text-slate-400" : "text-blue-600 dark:text-blue-400"
                              )} />
                            </div>
                            <div>
                              <h4 className={cn(
                                "font-medium",
                                isHidden ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"
                              )}>
                                {card.title}
                              </h4>
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs mt-1", categoryColor)}
                              >
                                {card.category}
                              </Badge>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleCard(card.id)}
                            className="h-8 w-8"
                          >
                            {isHidden ? (
                              <Eye className="h-4 w-4 text-slate-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-slate-500" />
                            )}
                          </Button>
                        </div>
                        
                        <p className={cn(
                          "text-sm",
                          isHidden ? "text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"
                        )}>
                          {card.description}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>Min: {card.minW}×{card.minH}</span>
                          <span>Default: {card.defaultW}×{card.defaultH}</span>
                          {card.pinned && (
                            <Badge variant="outline" className="text-xs">
                              Pinned
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
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
