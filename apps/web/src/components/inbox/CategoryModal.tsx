"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Fire, Home, ShoppingCart, DollarSign, Calculator, Clock, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { internalFetch } from '@/lib/internal-url';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory: string;
  threadId: string;
  onCategoryChange: (threadId: string, category: string) => void;
}

const categories = [
  {
    id: 'hot_lead',
    label: 'Hot Lead',
    emoji: '🔥',
    description: 'Immediate buying/selling intent, urgent response needed',
    icon: Fire,
    color: 'bg-red-100 text-red-800 border-red-300',
    priority: 'high'
  },
  {
    id: 'showing_request',
    label: 'Showing Request',
    emoji: '🏠',
    description: 'Client wants to see properties, schedule tours',
    icon: Home,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    priority: 'high'
  },
  {
    id: 'buyer_lead',
    label: 'Buyer Lead',
    emoji: '🛒',
    description: 'Looking to purchase property',
    icon: ShoppingCart,
    color: 'bg-green-100 text-green-800 border-green-300',
    priority: 'medium'
  },
  {
    id: 'seller_lead',
    label: 'Seller Lead',
    emoji: '💰',
    description: 'Want to sell their property',
    icon: DollarSign,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    priority: 'medium'
  },
  {
    id: 'price_inquiry',
    label: 'Price Inquiry',
    emoji: '🧮',
    description: 'Asking about pricing, negotiating offers',
    icon: Calculator,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    priority: 'medium'
  },
  {
    id: 'follow_up',
    label: 'Follow Up',
    emoji: '⏰',
    description: 'Requires agent response or follow-up action',
    icon: Clock,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    priority: 'low'
  },
  {
    id: 'contract',
    label: 'Contract',
    emoji: '📄',
    description: 'Legal documents, closing-related',
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    priority: 'high'
  },
  {
    id: 'marketing',
    label: 'Marketing',
    emoji: '🧊',
    description: 'Newsletters, promotional content',
    icon: Zap,
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    priority: 'low'
  }
];

export function CategoryModal({ 
  isOpen, 
  onClose, 
  currentCategory, 
  threadId, 
  onCategoryChange 
}: CategoryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (selectedCategory === currentCategory) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const response = await internalFetch(`/api/inbox/threads/${threadId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_category',
          data: { category: selectedCategory }
        })
      });

      if (response.ok) {
        onCategoryChange(threadId, selectedCategory);
        onClose();
      } else {
        console.error('Failed to update category');
        alert('Failed to update category. Please try again.');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Email Category
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose the category that best describes this email
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid gap-3">
              {categories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.id;
                
                return (
                  <motion.div
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg flex items-center justify-center",
                        category.color
                      )}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="text-lg">{category.emoji}</span>
                            {category.label}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              category.priority === 'high' ? 'border-red-300 text-red-700' :
                              category.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                              'border-green-300 text-green-700'
                            )}
                          >
                            {category.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.description}
                        </p>
                      </div>
                      
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Current: <Badge variant="outline" className="ml-1">
                {categories.find(c => c.id === currentCategory)?.label || 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || selectedCategory === currentCategory}
              >
                {loading ? 'Updating...' : 'Update Category'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}