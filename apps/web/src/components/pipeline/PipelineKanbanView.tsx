"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateDealModal from "./CreateDealModal";
import {
  DollarSign,
  Calendar,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  User,
  Plus,
  Target,
  TrendingUp,
  Flame,
  Snowflake,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Star,
  MapPin
} from "lucide-react";
import SMSWidget from "@/components/sms/SMSWidget";

export interface Deal {
  id: string;
  title: string;
  clientName: string;
  clientAvatar?: string;
  propertyAddress: string;
  propertyType: 'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family' | 'Commercial' | 'Land';
  dealValue: number;
  stage: string;
  daysInStage: number;
  probability: number;
  priority: 'hot' | 'warm' | 'cold';
  nextAction: {
    type: 'call' | 'email' | 'meeting' | 'showing' | 'follow_up';
    description: string;
    dueDate: Date;
  };
  lastActivity: Date;
  assignedAgent: string;
  leadSource: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  title: string;
  color: string;
  deals: Deal[];
  dealCount: number;
  totalValue: number;
  avgDaysInStage: number;
  conversionRate: number;
}

interface PipelineKanbanViewProps {
  searchQuery: string;
  quickFilters: any[];
  advancedFilters: any;
}

// Modern Stage Configuration
const MODERN_STAGES = [
  { 
    id: 'prospect', 
    title: 'Prospects', 
    color: 'slate',
    gradient: 'from-slate-400 to-slate-600',
    bgGradient: 'from-slate-50 to-slate-100',
    description: 'New potential clients'
  },
  { 
    id: 'qualified', 
    title: 'Qualified', 
    color: 'blue',
    gradient: 'from-blue-400 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    description: 'Verified leads'
  },
  { 
    id: 'showing', 
    title: 'Active Showing', 
    color: 'purple',
    gradient: 'from-purple-400 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100',
    description: 'Scheduled viewings'
  },
  { 
    id: 'negotiating', 
    title: 'Negotiating', 
    color: 'orange',
    gradient: 'from-orange-400 to-orange-600',
    bgGradient: 'from-orange-50 to-orange-100',
    description: 'In negotiations'
  },
  { 
    id: 'contract', 
    title: 'Under Contract', 
    color: 'emerald',
    gradient: 'from-emerald-400 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100',
    description: 'Contract signed'
  },
  { 
    id: 'closing', 
    title: 'Closing', 
    color: 'green',
    gradient: 'from-green-400 to-green-600',
    bgGradient: 'from-green-50 to-green-100',
    description: 'Final steps'
  }
];

// Sortable Deal Card Component
interface SortableDealCardProps {
  deal: Deal;
  onDealClick: (deal: Deal) => void;
  isDragging?: boolean;
}

function SortableDealCard({ deal, onDealClick, isDragging }: SortableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isSortableDragging || isDragging ? 'opacity-50 scale-105 z-50' : 'hover:scale-[1.02]'
      }`}
    >
      <DealCard 
        deal={deal} 
        onDealClick={onDealClick} 
        isDragging={isSortableDragging || isDragging} 
      />
    </div>
  );
}

// Droppable Stage Component
interface DroppableStageProps {
  stage: PipelineStage;
  stageConfig: any;
  children: React.ReactNode;
  isOver?: boolean;
}

function DroppableStage({ stage, stageConfig, children, isOver }: DroppableStageProps) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      className={`
        min-h-[600px] rounded-2xl transition-all duration-300 glass-card glass-border-subtle overflow-hidden
        ${isOver ? 'ring-2 ring-blue-400/50 glass-surface-strong' : ''}
      `}
      style={{
        background: `linear-gradient(135deg, var(--glass-surface) 0%, var(--glass-surface-subtle) 100%)`,
      }}
    >
      {children}
    </motion.div>
  );
}

// Deal Card Component
interface DealCardProps {
  deal: Deal;
  onDealClick: (deal: Deal) => void;
  isDragging?: boolean;
}

function DealCard({ deal, onDealClick, isDragging }: DealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityConfig = () => {
    switch (deal.priority) {
      case 'hot':
        return { 
          icon: <Flame className="h-3 w-3" />, 
          color: 'text-red-500',
          bg: 'from-red-500/10 to-red-500/5',
          border: 'border-l-red-500'
        };
      case 'warm':
        return { 
          icon: <TrendingUp className="h-3 w-3" />, 
          color: 'text-orange-500',
          bg: 'from-orange-500/10 to-orange-500/5',
          border: 'border-l-orange-500'
        };
      case 'cold':
        return { 
          icon: <Snowflake className="h-3 w-3" />, 
          color: 'text-blue-500',
          bg: 'from-blue-500/10 to-blue-500/5',
          border: 'border-l-blue-500'
        };
      default:
        return { 
          icon: <TrendingUp className="h-3 w-3" />, 
          color: 'text-gray-500',
          bg: 'from-gray-500/10 to-gray-500/5',
          border: 'border-l-gray-500'
        };
    }
  };

  const getActionConfig = (type: string) => {
    switch (type) {
      case 'call':
        return { icon: <Phone className="h-3 w-3" />, color: 'bg-green-100 text-green-700', label: 'Call' };
      case 'email':
        return { icon: <Mail className="h-3 w-3" />, color: 'bg-blue-100 text-blue-700', label: 'Email' };
      case 'meeting':
        return { icon: <User className="h-3 w-3" />, color: 'bg-purple-100 text-purple-700', label: 'Meeting' };
      case 'showing':
        return { icon: <Eye className="h-3 w-3" />, color: 'bg-orange-100 text-orange-700', label: 'Showing' };
      default:
        return { icon: <ArrowRight className="h-3 w-3" />, color: 'bg-gray-100 text-gray-700', label: 'Follow up' };
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const isOverdue = deal.nextAction.dueDate < new Date();
  const priorityConfig = getPriorityConfig();
  const actionConfig = getActionConfig(deal.nextAction.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      className={`mb-4 ${isDragging ? 'cursor-grabbing rotate-2' : 'cursor-pointer'}`}
    >
      <div 
        className={`
          glass-card glass-border glass-hover-tilt rounded-xl overflow-hidden transition-all duration-200
          border-l-4 ${priorityConfig.border} bg-gradient-to-r ${priorityConfig.bg}
          ${isDragging ? 'shadow-2xl scale-105' : 'shadow-sm hover:shadow-md'}
        `}
        onClick={isDragging ? undefined : () => onDealClick(deal)}
      >
        <div className="p-5">
          {/* Header with Client & Value */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-10 w-10 flex-shrink-0 glass-border">
                <AvatarImage src={deal.clientAvatar} />
                <AvatarFallback className="text-sm font-medium glass-surface">
                  {deal.clientName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold glass-text-glow text-base truncate mb-1">
                  {deal.clientName}
                </h3>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{deal.propertyAddress}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-1 ${priorityConfig.color}`}>
                {priorityConfig.icon}
              </div>
              <span className="text-lg font-bold text-emerald-600">
                {formatValue(deal.dealValue)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--glass-text-muted)' }}>
                Deal Progress
              </span>
              <span className="text-xs font-bold glass-text-glow">
                {deal.probability}%
              </span>
            </div>
            <div className="h-2 glass-surface rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${deal.probability}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  deal.probability >= 80 ? 'from-green-400 to-green-600' :
                  deal.probability >= 60 ? 'from-orange-400 to-orange-600' :
                  deal.probability >= 40 ? 'from-yellow-400 to-yellow-600' : 
                  'from-red-400 to-red-600'
                }`}
              />
            </div>
          </div>

          {/* Next Action & Days in Stage */}
          <div className="flex items-center justify-between mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${actionConfig.color}`}>
              {actionConfig.icon}
              <span>{actionConfig.label}</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium glass-text-glow">
                {deal.daysInStage}d in stage
              </div>
              {isOverdue && (
                <div className="text-xs text-red-500 font-bold">
                  Overdue!
                </div>
              )}
            </div>
          </div>

          {/* Property Type & Tags */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs glass-badge">
              {deal.propertyType}
            </Badge>
            {deal.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs glass-badge-muted">
                {tag}
              </Badge>
            ))}
            {deal.tags.length > 2 && (
              <Badge variant="outline" className="text-xs glass-badge-muted">
                +{deal.tags.length - 2}
              </Badge>
            )}
          </div>

          {/* Expandable Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t glass-border-subtle pt-4 mt-4"
              >
                <div className="space-y-2 text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                  <div className="flex justify-between">
                    <span>Agent:</span>
                    <span className="font-medium">{deal.assignedAgent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="font-medium">{deal.leadSource}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Action:</span>
                    <span className="font-medium">{deal.nextAction.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due:</span>
                    <span className={`font-medium ${isOverdue ? 'text-red-500' : ''}`}>
                      {deal.nextAction.dueDate.toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs glass-button-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${deal.clientPhone || ''}`);
                      }}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs glass-button-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Convert deal to contact format for SMS widget
                        setSelectedDealForSMS(deal);
                        setShowSMSWidget(true);
                      }}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      SMS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs glass-button-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`mailto:${deal.clientEmail || ''}`);
                      }}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-6 text-xs glass-hover-pulse"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function PipelineKanbanView({ searchQuery, quickFilters, advancedFilters }: PipelineKanbanViewProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showSMSWidget, setShowSMSWidget] = useState(false);
  const [selectedDealForSMS, setSelectedDealForSMS] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // Fetch pipeline data
  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const response = await fetch('/api/pipeline/stages');
        if (!response.ok) throw new Error('Failed to fetch pipeline data');
        
        const { stages: apiStages } = await response.json();
        
        // Convert API data to component format
        const realDeals: Deal[] = [];
        const stageData: PipelineStage[] = [];
        
        // Process API stages or create default empty stages
        const stagesToProcess = apiStages.length > 0 ? apiStages : MODERN_STAGES.map(s => ({ 
          ...s, 
          leads: [] 
        }));
        
        stagesToProcess.forEach((apiStage: any, index: number) => {
          const stageConfig = MODERN_STAGES[index % MODERN_STAGES.length];
          
          // Convert API leads to Deal format
          const stageDeals: Deal[] = (apiStage.leads || []).map((lead: any) => ({
            id: lead.id,
            title: lead.title || `${lead.contact?.name || 'Contact'} Deal`,
            clientName: lead.contact?.name || 'Unknown Contact',
            clientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.contact?.name || lead.id}`,
            propertyAddress: lead.property?.address || '123 Main St, City, State',
            propertyType: lead.property?.type || 'Single Family',
            dealValue: lead.value || Math.floor(Math.random() * 500000) + 200000,
            stage: apiStage.id || stageConfig.id,
            daysInStage: Math.floor((Date.now() - new Date(lead.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
            probability: lead.probability || Math.floor(Math.random() * 40) + 20 + (index * 10),
            priority: lead.priority || (['hot', 'warm', 'cold'][Math.floor(Math.random() * 3)] as any),
            nextAction: {
              type: ['call', 'email', 'meeting', 'showing', 'follow_up'][Math.floor(Math.random() * 5)] as any,
              description: lead.notes || 'Follow up required',
              dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000)
            },
            lastActivity: new Date(lead.updatedAt || Date.now()),
            assignedAgent: lead.assignedTo || 'John Doe',
            leadSource: lead.source || 'Website',
            tags: lead.tags || ['First Time Buyer'],
            createdAt: new Date(lead.createdAt || Date.now()),
            updatedAt: new Date(lead.updatedAt || Date.now())
          }));
          
          realDeals.push(...stageDeals);
          
          // Create stage data
          const totalValue = stageDeals.reduce((sum, deal) => sum + deal.dealValue, 0);
          const avgDays = stageDeals.length > 0 
            ? stageDeals.reduce((sum, deal) => sum + deal.daysInStage, 0) / stageDeals.length 
            : 0;
          
          stageData.push({
            id: apiStage.id || stageConfig.id,
            title: apiStage.name || stageConfig.title,
            color: stageConfig.color,
            deals: stageDeals,
            dealCount: stageDeals.length,
            totalValue,
            avgDaysInStage: Math.round(avgDays),
            conversionRate: Math.max(0, 95 - (index * 15))
          });
        });
        
        setStages(stageData);
        setDeals(realDeals);
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
        
        // Fallback to empty stages
        const fallbackStages = MODERN_STAGES.map((stage, index) => ({
          id: stage.id,
          title: stage.title,
          color: stage.color,
          deals: [],
          dealCount: 0,
          totalValue: 0,
          avgDaysInStage: 0,
          conversionRate: Math.max(0, 95 - (index * 15))
        }));
        setStages(fallbackStages);
        setDeals([]);
      }
    };
    
    fetchPipelineData();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active deal
    const activeDeal = deals.find(deal => deal.id === activeId);
    if (!activeDeal) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    // Determine target stage
    let targetStageId = overId;
    
    // If dropped on another deal, get that deal's stage
    const overDeal = deals.find(deal => deal.id === overId);
    if (overDeal) {
      targetStageId = overDeal.stage;
    }

    // If dropped on a stage directly
    const overStage = stages.find(stage => stage.id === overId);
    if (overStage) {
      targetStageId = overStage.id;
    }

    // Update deal stage if it changed
    if (activeDeal.stage !== targetStageId) {
      const updatedDeals = deals.map(deal => 
        deal.id === activeId 
          ? { ...deal, stage: targetStageId, daysInStage: 0, updatedAt: new Date() }
          : deal
      );
      
      setDeals(updatedDeals);

      // Update stages
      const updatedStages = stages.map(stage => {
        const stageDeals = updatedDeals.filter(deal => deal.stage === stage.id);
        const totalValue = stageDeals.reduce((sum, deal) => sum + deal.dealValue, 0);
        const avgDays = stageDeals.length > 0 
          ? stageDeals.reduce((sum, deal) => sum + deal.daysInStage, 0) / stageDeals.length 
          : 0;
        
        return {
          ...stage,
          deals: stageDeals,
          dealCount: stageDeals.length,
          totalValue,
          avgDaysInStage: Math.round(avgDays)
        };
      });
      
      setStages(updatedStages);
    }

    setActiveId(null);
    setOverId(null);
  };

  const activeDeal = deals.find(deal => deal.id === activeId);

  const handleCreateDeal = (stageId?: string) => {
    setSelectedStage(stageId || null);
    setShowCreateModal(true);
  };

  const handleDealCreated = () => {
    // Refresh the pipeline data when a deal is created
    const fetchPipelineData = async () => {
      try {
        const response = await fetch('/api/pipeline/stages');
        if (!response.ok) throw new Error('Failed to fetch pipeline data');
        
        const { stages: apiStages } = await response.json();
        
        // Convert API data to component format (same logic as useEffect)
        const realDeals: Deal[] = [];
        const stageData: PipelineStage[] = [];
        
        const stagesToProcess = apiStages.length > 0 ? apiStages : MODERN_STAGES.map(s => ({ 
          ...s, 
          leads: [] 
        }));
        
        stagesToProcess.forEach((apiStage: any, index: number) => {
          const stageConfig = MODERN_STAGES[index % MODERN_STAGES.length];
          
          const stageDeals: Deal[] = (apiStage.leads || []).map((lead: any) => ({
            id: lead.id,
            title: lead.title || `${lead.contact?.name || 'Contact'} Deal`,
            clientName: lead.contact?.name || 'Unknown Contact',
            clientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.contact?.name || lead.id}`,
            propertyAddress: lead.property?.address || '123 Main St, City, State',
            propertyType: lead.property?.type || 'Single Family',
            dealValue: lead.value || Math.floor(Math.random() * 500000) + 200000,
            stage: apiStage.id || stageConfig.id,
            daysInStage: Math.floor((Date.now() - new Date(lead.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
            probability: lead.probability || Math.floor(Math.random() * 40) + 20 + (index * 10),
            priority: lead.priority || (['hot', 'warm', 'cold'][Math.floor(Math.random() * 3)] as any),
            nextAction: {
              type: ['call', 'email', 'meeting', 'showing', 'follow_up'][Math.floor(Math.random() * 5)] as any,
              description: lead.notes || 'Follow up required',
              dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000)
            },
            lastActivity: new Date(lead.updatedAt || Date.now()),
            assignedAgent: lead.assignedTo || 'John Doe',
            leadSource: lead.source || 'Website',
            tags: lead.tags || ['First Time Buyer'],
            createdAt: new Date(lead.createdAt || Date.now()),
            updatedAt: new Date(lead.updatedAt || Date.now())
          }));
          
          realDeals.push(...stageDeals);
          
          const totalValue = stageDeals.reduce((sum, deal) => sum + deal.dealValue, 0);
          const avgDays = stageDeals.length > 0 
            ? stageDeals.reduce((sum, deal) => sum + deal.daysInStage, 0) / stageDeals.length 
            : 0;
          
          stageData.push({
            id: apiStage.id || stageConfig.id,
            title: apiStage.name || stageConfig.title,
            color: stageConfig.color,
            deals: stageDeals,
            dealCount: stageDeals.length,
            totalValue,
            avgDaysInStage: Math.round(avgDays),
            conversionRate: Math.max(0, 95 - (index * 15))
          });
        });
        
        setStages(stageData);
        setDeals(realDeals);
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
      }
    };
    
    fetchPipelineData();
  };

  // Apply filters
  const filteredStages = stages.map(stage => ({
    ...stage,
    deals: stage.deals.filter(deal => {
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          deal.clientName.toLowerCase().includes(searchLower) ||
          deal.propertyAddress.toLowerCase().includes(searchLower) ||
          deal.title.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Apply quick filters
      if (quickFilters.length > 0) {
        return quickFilters.some(filter => {
          switch (filter.id) {
            case 'hot-leads':
              return deal.priority === 'hot';
            case 'high-value':
              return deal.dealValue > 500000;
            case 'overdue':
              return deal.nextAction.dueDate < new Date();
            case 'this-week':
              const weekFromNow = new Date();
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              return deal.nextAction.dueDate <= weekFromNow;
            case 'new-leads':
              return deal.daysInStage <= 7;
            default:
              return true;
          }
        });
      }

      return true;
    })
  }));

  return (
    <div className="h-full overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-6">
          {filteredStages.map((stage, index) => {
            const stageConfig = MODERN_STAGES.find(s => s.id === stage.id) || MODERN_STAGES[index % MODERN_STAGES.length];
            
            return (
              <motion.div
                key={stage.id}
                layout
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-80"
              >
                {/* Enhanced Stage Header */}
                <div className={`mb-6 glass-card glass-border rounded-2xl overflow-hidden bg-gradient-to-br ${stageConfig.bgGradient}/10`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${stageConfig.gradient}/20 glass-surface`}>
                          <Target className="h-5 w-5" style={{ color: 'var(--glass-primary)' }} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg glass-text-glow">
                            {stage.title}
                          </h3>
                          <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                            {stageConfig.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="glass-badge font-bold">
                          {stage.dealCount}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 glass-hover-pulse"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCreateDeal(stage.id);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Stage Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-600 glass-text-glow">
                          {stage.totalValue >= 1000000 ? `$${(stage.totalValue / 1000000).toFixed(1)}M` : 
                           stage.totalValue >= 1000 ? `$${(stage.totalValue / 1000).toFixed(0)}K` : 
                           `$${stage.totalValue.toLocaleString()}`}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                          Total Value
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold glass-text-glow">
                          {stage.avgDaysInStage}d
                        </div>
                        <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                          Avg Days
                        </div>
                      </div>
                    </div>
                    
                    {/* Conversion Rate Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                          Conversion Rate
                        </span>
                        <span className="text-xs font-bold glass-text-glow">
                          {stage.conversionRate}%
                        </span>
                      </div>
                      <div className="h-1.5 glass-surface rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.conversionRate}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                          className={`h-full bg-gradient-to-r ${stageConfig.gradient} rounded-full`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deals Container */}
                <SortableContext 
                  items={stage.deals.map(deal => deal.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableStage 
                    stage={stage} 
                    stageConfig={stageConfig}
                    isOver={overId === stage.id}
                  >
                    <div className="p-6">
                      <AnimatePresence>
                        {stage.deals.map((deal) => (
                          <SortableDealCard
                            key={deal.id}
                            deal={deal}
                            onDealClick={setSelectedDeal}
                            isDragging={deal.id === activeId}
                          />
                        ))}
                      </AnimatePresence>
                      
                      {/* Enhanced Empty State */}
                      {stage.deals.length === 0 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center h-64 text-center"
                        >
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stageConfig.gradient}/20 glass-surface flex items-center justify-center mb-4`}>
                            <Plus className="h-8 w-8" style={{ color: 'var(--glass-text-muted)' }} />
                          </div>
                          <p className="font-semibold glass-text-glow mb-2">
                            Ready for {stage.title}?
                          </p>
                          <p className="text-sm max-w-xs" style={{ color: 'var(--glass-text-muted)' }}>
                            Drop deals here or create new ones to populate this stage
                          </p>
                          <Button 
                            variant="liquid" 
                            size="sm" 
                            className="mt-4 glass-click-ripple"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCreateDeal(stage.id);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Deal
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </DroppableStage>
                </SortableContext>
              </motion.div>
            );
          })}
        </div>

        {/* Enhanced Drag Overlay */}
        <DragOverlay 
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
          style={{
            cursor: 'grabbing',
          }}
        >
          {activeDeal ? (
            <div 
              className="rotate-1 scale-110 opacity-90 cursor-grabbing shadow-2xl" 
              style={{ 
                zIndex: 1000,
                transform: 'translate(-50%, -50%)',
                transformOrigin: 'center',
                pointerEvents: 'none'
              }}
            >
              <DealCard deal={activeDeal} onDealClick={() => {}} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateDealModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onDealCreated={handleDealCreated}
        selectedStage={selectedStage}
      />

      {/* SMS Widget */}
      <SMSWidget
        isOpen={showSMSWidget}
        onClose={() => {
          setShowSMSWidget(false);
          setSelectedDealForSMS(null);
        }}
        initialContactId={selectedDealForSMS?.clientName ? `deal_${selectedDealForSMS.id}` : undefined}
      />
    </div>
  );
}