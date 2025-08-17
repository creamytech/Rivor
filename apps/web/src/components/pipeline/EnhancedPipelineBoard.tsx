"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Filter, 
  Users, 
  MoreHorizontal,
  User, 
  Building, 
  Home,
  Clock,
  Calendar,
  MessageSquare,
  ArrowUp,
  CheckCircle,
  AlertCircle,
  Star,
  Eye,
  Trash2,
  Settings,
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  Search,
  X,
  Move,
  Copy,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Deal {
  id: string;
  title: string;
  contact: {
    name: string;
    email: string;
    avatar?: string;
  };
  company: string;
  value: number;
  probability: number;
  stage: string;
  intent: 'buyer' | 'seller' | 'renter' | 'other';
  confidence: number;
  lastMessageTime: string;
  nextTask?: {
    type: 'call' | 'email' | 'meeting' | 'follow-up';
    dueDate: string;
    description: string;
  };
  assignedTo?: {
    name: string;
    avatar?: string;
  };
  source: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  slaDays: number;
  avgDaysInStage: number;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  deals: Deal[];
  count: number;
  wipLimit?: number;
  avgDaysInStage: number;
  dropOffRate?: number;
}

interface FilterOption {
  id: string;
  label: string;
  type: 'intent' | 'agent' | 'source' | 'value' | 'confidence';
  value: string;
}

export default function EnhancedPipelineBoard() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [groupBy, setGroupBy] = useState<'owner' | 'source'>('owner');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mock data
  useEffect(() => {
    const mockStages: PipelineStage[] = [
      {
        id: 'new',
        name: 'New',
        color: 'blue',
        position: 1,
        count: 8,
        wipLimit: 10,
        avgDaysInStage: 2.5,
        dropOffRate: 15,
        deals: [
          {
            id: '1',
            title: 'Property inquiry - 123 Main St',
            contact: { name: 'John Smith', email: 'john@email.com' },
            company: 'Individual',
            value: 350000,
            probability: 25,
            stage: 'new',
            intent: 'buyer',
            confidence: 85,
            lastMessageTime: '2 hours ago',
            nextTask: {
              type: 'call',
              dueDate: '2024-01-20',
              description: 'Initial consultation call'
            },
            assignedTo: { name: 'Sarah Johnson' },
            source: 'Email',
            createdAt: '2024-01-18',
            updatedAt: '2024-01-18',
            tags: ['high-priority', 'first-time-buyer'],
            slaDays: 3,
            avgDaysInStage: 2
          },
          {
            id: '2',
            title: 'Commercial lease inquiry',
            contact: { name: 'Mike Wilson', email: 'mike@company.com' },
            company: 'Tech Corp',
            value: 120000,
            probability: 40,
            stage: 'new',
            intent: 'renter',
            confidence: 78,
            lastMessageTime: '1 day ago',
            nextTask: {
              type: 'meeting',
              dueDate: '2024-01-22',
              description: 'Property viewing'
            },
            source: 'Website',
            createdAt: '2024-01-17',
            updatedAt: '2024-01-17',
            tags: ['commercial', 'lease'],
            slaDays: 3,
            avgDaysInStage: 1
          }
        ]
      },
      {
        id: 'qualified',
        name: 'Qualified',
        color: 'green',
        position: 2,
        count: 5,
        wipLimit: 8,
        avgDaysInStage: 5.2,
        dropOffRate: -8,
        deals: [
          {
            id: '3',
            title: 'House valuation request',
            contact: { name: 'Lisa Brown', email: 'lisa@email.com' },
            company: 'Individual',
            value: 450000,
            probability: 60,
            stage: 'qualified',
            intent: 'seller',
            confidence: 92,
            lastMessageTime: '3 days ago',
            nextTask: {
              type: 'follow-up',
              dueDate: '2024-01-25',
              description: 'Send market analysis'
            },
            assignedTo: { name: 'David Chen' },
            source: 'Referral',
            createdAt: '2024-01-15',
            updatedAt: '2024-01-16',
            tags: ['valuation', 'market-analysis'],
            slaDays: 7,
            avgDaysInStage: 4
          }
        ]
      },
      {
        id: 'meeting',
        name: 'Meeting Set',
        color: 'purple',
        position: 3,
        count: 3,
        wipLimit: 6,
        avgDaysInStage: 8.1,
        dropOffRate: 12,
        deals: []
      },
      {
        id: 'proposal',
        name: 'Proposal',
        color: 'orange',
        position: 4,
        count: 2,
        wipLimit: 5,
        avgDaysInStage: 12.3,
        dropOffRate: 5,
        deals: []
      },
      {
        id: 'closed',
        name: 'Closed',
        color: 'gray',
        position: 5,
        count: 1,
        avgDaysInStage: 18.5,
        deals: []
      }
    ];
    setStages(mockStages);
    setLoading(false);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setDragOverStage(over?.id as string || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragOverStage(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the deal being dragged
    const activeDeal = stages
      .flatMap(stage => stage.deals)
      .find(deal => deal.id === activeId);

    if (!activeDeal) return;

    // Find the target stage
    const targetStage = stages.find(stage => 
      stage.id === overId || stage.deals.some(deal => deal.id === overId)
    );

    if (!targetStage || activeDeal.stage === targetStage.id) return;

    // Check WIP limit
    if (targetStage.wipLimit && targetStage.deals.length >= targetStage.wipLimit) {
      console.log('WIP limit reached for stage:', targetStage.name);
      return;
    }

    // Optimistic update
    setStages(prevStages => {
      const newStages = prevStages.map(stage => ({
        ...stage,
        deals: stage.deals.filter(deal => deal.id !== activeId),
        count: stage.deals.filter(deal => deal.id !== activeId).length
      }));

      const targetStageIndex = newStages.findIndex(s => s.id === targetStage.id);
      if (targetStageIndex !== -1) {
        const updatedDeal = { ...activeDeal, stage: targetStage.id };
        newStages[targetStageIndex] = {
          ...newStages[targetStageIndex],
          deals: [...newStages[targetStageIndex].deals, updatedDeal],
          count: newStages[targetStageIndex].deals.length + 1
        };
      }

      return newStages;
    });

    // TODO: Persist the change to API
    console.log(`Moved deal "${activeDeal.title}" to ${targetStage.name}`);
  };

  const handleBulkAction = (action: 'move' | 'assign' | 'archive' | 'delete') => {
    console.log(`Bulk ${action} for deals:`, Array.from(selectedDeals));
    setSelectedDeals(new Set());
    setShowBulkActions(false);
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'buyer': return <Home className="h-3 w-3" />;
      case 'seller': return <Building className="h-3 w-3" />;
      case 'renter': return <User className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'buyer': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'seller': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'renter': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const getStageColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'purple': 'bg-purple-500',
      'orange': 'bg-orange-500',
      'gray': 'bg-slate-500'
    };
    return colorMap[color] || 'bg-slate-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'call': return <MessageSquare className="h-3 w-3" />;
      case 'email': return <MessageSquare className="h-3 w-3" />;
      case 'meeting': return <Calendar className="h-3 w-3" />;
      case 'follow-up': return <ArrowUp className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const renderDealCard = (deal: Deal, isDragging = false) => (
    <motion.div
      key={deal.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group',
        isDragging && 'rotate-3 shadow-xl',
        selectedDeals.has(deal.id) && 'ring-2 ring-blue-500'
      )}
      onClick={() => {
        if (selectedDeals.has(deal.id)) {
          setSelectedDeals(prev => {
            const newSet = new Set(prev);
            newSet.delete(deal.id);
            return newSet;
          });
        } else {
          setSelectedDeals(prev => new Set(prev).add(deal.id));
        }
      }}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
              {deal.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {deal.contact.name} • {deal.company}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Intent and Confidence */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getIntentColor(deal.intent)}`}
          >
            {getIntentIcon(deal.intent)}
            <span className="ml-1 capitalize">{deal.intent}</span>
          </Badge>
          
          <Badge 
            variant="outline" 
            className={`text-xs ${getConfidenceColor(deal.confidence)}`}
          >
            {deal.confidence}% confidence
          </Badge>
        </div>

        {/* Value and Probability */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            ${deal.value.toLocaleString()}
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            {deal.probability}% probability
          </span>
        </div>

        {/* Last Message Time */}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {deal.lastMessageTime}
        </div>

        {/* Next Task */}
        {deal.nextTask && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded text-xs">
            {getTaskIcon(deal.nextTask.type)}
            <span className="text-slate-600 dark:text-slate-400">
              {deal.nextTask.description}
            </span>
          </div>
        )}

        {/* Assigned To */}
        {deal.assignedTo && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={deal.assignedTo.avatar} />
              <AvatarFallback className="text-xs">
                {deal.assignedTo.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {deal.assignedTo.name}
            </span>
          </div>
        )}

        {/* Tags */}
        {deal.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {deal.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {deal.tags.length > 2 && (
              <span className="text-xs text-slate-500">
                +{deal.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderStageColumn = (stage: PipelineStage) => (
    <div key={stage.id} className="flex flex-col min-h-[600px]">
      {/* Stage Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStageColor(stage.color)}`} />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {stage.name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {stage.count}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* SLA Info */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
          <span>Avg: {stage.avgDaysInStage}d</span>
          {stage.wipLimit && (
            <span className={cn(
              stage.count >= stage.wipLimit ? 'text-red-500' : 'text-green-500'
            )}>
              {stage.count}/{stage.wipLimit}
            </span>
          )}
        </div>

        {/* SLA Heatmap */}
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-300',
              stage.avgDaysInStage > 10 ? 'bg-red-500' :
              stage.avgDaysInStage > 7 ? 'bg-yellow-500' : 'bg-green-500'
            )}
            style={{ width: `${Math.min((stage.avgDaysInStage / 15) * 100, 100)}%` }}
          />
        </div>

        {/* Drop-off Rate */}
        {stage.dropOffRate !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {stage.dropOffRate > 0 ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : (
              <TrendingUp className="h-3 w-3 text-green-500" />
            )}
            <span className={cn(
              'text-xs',
              stage.dropOffRate > 0 ? 'text-red-500' : 'text-green-500'
            )}>
              {Math.abs(stage.dropOffRate)}%
            </span>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div 
        className={cn(
          'flex-1 min-h-[400px] p-2 rounded-lg border-2 border-dashed transition-all',
          dragOverStage === stage.id 
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
            : 'border-slate-200 dark:border-slate-700'
        )}
      >
        <SortableContext
          items={stage.deals.map(deal => deal.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {stage.deals.map((deal) => renderDealCard(deal))}
          </div>
        </SortableContext>
      </div>
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Board Toolbar */}
        <GlassCard variant="gradient" intensity="medium">
          <GlassCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Group by:</span>
                  <Button
                    variant={groupBy === 'owner' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('owner')}
                  >
                    Owner
                  </Button>
                  <Button
                    variant={groupBy === 'source' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('source')}
                  >
                    Source
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedDeals.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedDeals.size} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkActions(!showBulkActions)}
                    >
                      Bulk Actions
                    </Button>
                  </div>
                )}
                
                <Button 
                  className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Deal
                </Button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Pipeline Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stages.map(renderStageColumn)}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            (() => {
              const deal = stages
                .flatMap(stage => stage.deals)
                .find(d => d.id === activeId);
              return deal ? renderDealCard(deal, true) : null;
            })()
          ) : null}
        </DragOverlay>

        {/* Bulk Actions Modal */}
        <AnimatePresence>
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
            >
              <GlassCard variant="gradient" intensity="medium">
                <GlassCardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {selectedDeals.size} deals selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('move')}
                    >
                      <Move className="h-4 w-4 mr-2" />
                      Move
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('assign')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assign
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('archive')}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBulkActions(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndContext>
  );
}
