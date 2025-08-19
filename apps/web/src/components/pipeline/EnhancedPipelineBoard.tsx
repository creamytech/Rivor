"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragStartEvent,
  DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Briefcase, 
  DollarSign, 
  User, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Star,
  MoreHorizontal,
  Plus,
  Filter,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Target,
  Zap,
  Building,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number;
  stage: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  contact: {
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  lastActivity: Date;
  nextActivity?: Date;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  notes: string;
  createdAt: Date;
  expectedCloseDate: Date;
  actualCloseDate?: Date;
  source: string;
  isHot: boolean;
  isOverdue: boolean;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
  totalValue: number;
  dealCount: number;
  winRate: number;
}

interface EnhancedPipelineBoardProps {
  searchQuery: string;
  groupBy: string;
}

export default function EnhancedPipelineBoard({ 
  searchQuery, 
  groupBy 
}: EnhancedPipelineBoardProps) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'table' | 'analytics'>('board');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Mock data
  const mockStages: PipelineStage[] = [
    {
      id: 'prospect',
      name: 'Prospect',
      color: 'blue',
      totalValue: 1250000,
      dealCount: 8,
      winRate: 25,
      deals: [
        {
          id: '1',
          title: 'Enterprise License',
          company: 'TechCorp Inc.',
          value: 250000,
          probability: 25,
          stage: 'prospect',
          owner: {
            id: 'user1',
            name: 'John Doe',
            avatar: '/api/avatar/john'
          },
          contact: {
            name: 'Sarah Johnson',
            email: 'sarah@techcorp.com',
            phone: '+1 (555) 123-4567',
            avatar: '/api/avatar/sarah'
          },
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          nextActivity: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          priority: 'high',
          tags: ['enterprise', 'tech', 'new'],
          notes: 'Interested in enterprise features and scalability',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          source: 'Website',
          isHot: true,
          isOverdue: false
        },
        {
          id: '2',
          title: 'Professional Services',
          company: 'StartupXYZ',
          value: 75000,
          probability: 30,
          stage: 'prospect',
          owner: {
            id: 'user2',
            name: 'Jane Smith',
            avatar: '/api/avatar/jane'
          },
          contact: {
            name: 'Mike Chen',
            email: 'mike@startupxyz.com',
            phone: '+1 (555) 987-6543',
            avatar: '/api/avatar/mike'
          },
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          nextActivity: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          priority: 'medium',
          tags: ['startup', 'services'],
          notes: 'Looking for implementation support',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          source: 'Referral',
          isHot: false,
          isOverdue: false
        }
      ]
    },
    {
      id: 'qualified',
      name: 'Qualified',
      color: 'purple',
      totalValue: 850000,
      dealCount: 5,
      winRate: 40,
      deals: [
        {
          id: '3',
          title: 'Annual Contract',
          company: 'Acme Corp',
          value: 180000,
          probability: 50,
          stage: 'qualified',
          owner: {
            id: 'user1',
            name: 'John Doe',
            avatar: '/api/avatar/john'
          },
          contact: {
            name: 'David Wilson',
            email: 'david@acmecorp.com',
            phone: '+1 (555) 456-7890',
            avatar: '/api/avatar/david'
          },
          lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
          nextActivity: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          priority: 'high',
          tags: ['annual', 'contract', 'enterprise'],
          notes: 'Budget approved, technical evaluation in progress',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          source: 'Trade Show',
          isHot: true,
          isOverdue: false
        }
      ]
    },
    {
      id: 'proposal',
      name: 'Proposal',
      color: 'orange',
      totalValue: 650000,
      dealCount: 4,
      winRate: 60,
      deals: [
        {
          id: '4',
          title: 'Multi-Year License',
          company: 'Global Industries',
          value: 320000,
          probability: 70,
          stage: 'proposal',
          owner: {
            id: 'user3',
            name: 'Bob Wilson',
            avatar: '/api/avatar/bob'
          },
          contact: {
            name: 'Lisa Anderson',
            email: 'lisa@globalindustries.com',
            phone: '+1 (555) 321-6540',
            avatar: '/api/avatar/lisa'
          },
          lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000),
          nextActivity: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          priority: 'medium',
          tags: ['multi-year', 'enterprise', 'proposal'],
          notes: 'Proposal submitted, awaiting legal review',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          expectedCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          source: 'Cold Outreach',
          isHot: false,
          isOverdue: false
        }
      ]
    },
    {
      id: 'negotiation',
      name: 'Negotiation',
      color: 'yellow',
      totalValue: 420000,
      dealCount: 3,
      winRate: 75,
      deals: [
        {
          id: '5',
          title: 'Enterprise Suite',
          company: 'MegaCorp',
          value: 420000,
          probability: 85,
          stage: 'negotiation',
          owner: {
            id: 'user2',
            name: 'Jane Smith',
            avatar: '/api/avatar/jane'
          },
          contact: {
            name: 'Robert Johnson',
            email: 'robert@megacorp.com',
            phone: '+1 (555) 789-0123',
            avatar: '/api/avatar/robert'
          },
          lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000),
          nextActivity: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          priority: 'high',
          tags: ['enterprise', 'negotiation', 'hot'],
          notes: 'Final contract terms being negotiated',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          source: 'Partner',
          isHot: true,
          isOverdue: false
        }
      ]
    },
    {
      id: 'closed-won',
      name: 'Closed Won',
      color: 'green',
      totalValue: 280000,
      dealCount: 2,
      winRate: 100,
      deals: [
        {
          id: '6',
          title: 'Starter Package',
          company: 'SmallBiz Inc.',
          value: 280000,
          probability: 100,
          stage: 'closed-won',
          owner: {
            id: 'user1',
            name: 'John Doe',
            avatar: '/api/avatar/john'
          },
          contact: {
            name: 'Emily Davis',
            email: 'emily@smallbiz.com',
            phone: '+1 (555) 234-5678',
            avatar: '/api/avatar/emily'
          },
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          actualCloseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          priority: 'medium',
          tags: ['closed', 'starter', 'won'],
          notes: 'Successfully closed, implementation starting next week',
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          expectedCloseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          source: 'Website',
          isHot: false,
          isOverdue: false
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setStages(mockStages);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag started:', event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    console.log('Drag over:', event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      // Handle deal movement between stages
      console.log('Moving deal:', active.id, 'to stage:', over?.id);
      
      // Update the stages state with the new deal positions
      // This would typically involve an API call to update the deal stage
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getStageColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getDaysUntilClose = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'board' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('board')}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Board
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('analytics')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>

        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Pipeline Board */}
      {viewMode === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {stages.map((stage) => (
              <div key={stage.id} className="space-y-4">
                {/* Stage Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-sm font-medium", getStageColor(stage.color))}
                    >
                      {stage.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {stage.dealCount}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Stage Stats */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Value</span>
                      <span className="font-medium">{formatCurrency(stage.totalValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Win Rate</span>
                      <span className="font-medium">{stage.winRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Deals */}
                <SortableContext items={stage.deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {stage.deals.map((deal) => (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          layout
                        >
                          <DealCard 
                            deal={deal} 
                            onSelect={() => setActiveDeal(deal)}
                            isSelected={activeDeal?.id === deal.id}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        </DndContext>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4" />
                Total Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stages.reduce((sum, stage) => sum + stage.totalValue, 0))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Across {stages.reduce((sum, stage) => sum + stage.dealCount, 0)} deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stages.reduce((sum, stage) => sum + stage.winRate, 0) / stages.length)}%
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Average across all stages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Avg Cycle Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45 days</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                From prospect to close
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4" />
                Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stages.reduce((sum, stage) => 
                  sum + (stage.totalValue * stage.winRate / 100), 0
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Weighted by probability
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Deal Card Component
interface DealCardProps {
  deal: Deal;
  onSelect: () => void;
  isSelected: boolean;
}

function DealCard({ deal, onSelect, isSelected }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getDaysUntilClose = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:shadow-md transition-all",
        isSelected && "ring-2 ring-blue-500",
        isDragging && "opacity-50 rotate-2"
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 mb-1">
            {deal.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {deal.company}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {deal.isHot && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
          {deal.isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Value and Probability */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm">
          {formatCurrency(deal.value)}
        </span>
        <Badge variant="outline" className="text-xs">
          {deal.probability}%
        </Badge>
      </div>

      {/* Contact */}
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-6 w-6">
          <AvatarImage src={deal.contact.avatar} />
          <AvatarFallback className="text-xs">
            {deal.contact.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            {deal.contact.name}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {deal.contact.email}
          </p>
        </div>
      </div>

      {/* Owner */}
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-5 w-5">
          <AvatarImage src={deal.owner.avatar} />
          <AvatarFallback className="text-xs">
            {deal.owner.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {deal.owner.name}
        </span>
      </div>

      {/* Tags */}
      {deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {deal.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {deal.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{deal.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{formatDate(deal.lastActivity)}</span>
        <div className="flex items-center gap-1">
          <Badge 
            variant="secondary" 
            className={cn("text-xs", getPriorityColor(deal.priority))}
          >
            {deal.priority}
          </Badge>
        </div>
      </div>

      {/* Close Date Warning */}
      {deal.expectedCloseDate && getDaysUntilClose(deal.expectedCloseDate) <= 7 && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-400">
          <Clock className="h-3 w-3 inline mr-1" />
          Closes in {getDaysUntilClose(deal.expectedCloseDate)} days
        </div>
      )}
    </div>
  );
}
