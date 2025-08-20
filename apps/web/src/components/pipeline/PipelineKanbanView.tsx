"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Eye,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Flame,
  Snowflake,
  Home,
  User,
  Building,
  Plus,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from "lucide-react";

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

// Pipeline data now fetched from real API - no mock data needed

const PIPELINE_STAGES = [
  { id: 'lead', title: 'New Lead', color: 'bg-slate-500', bgColor: 'bg-slate-50', lightBg: 'bg-slate-50' },
  { id: 'qualified', title: 'Qualified', color: 'bg-blue-500', bgColor: 'bg-blue-50', lightBg: 'bg-blue-50' },
  { id: 'showing', title: 'Showing Scheduled', color: 'bg-purple-500', bgColor: 'bg-purple-50', lightBg: 'bg-purple-50' },
  { id: 'offer', title: 'Offer Made', color: 'bg-orange-500', bgColor: 'bg-orange-50', lightBg: 'bg-orange-50' },
  { id: 'contract', title: 'Under Contract', color: 'bg-green-500', bgColor: 'bg-green-50', lightBg: 'bg-green-50' },
  { id: 'closed', title: 'Closed', color: 'bg-emerald-500', bgColor: 'bg-emerald-50', lightBg: 'bg-emerald-50' }
];

// Sortable Deal Card Component
interface SortableDealCardProps {
  deal: Deal;
  onDealClick: (deal: Deal) => void;
}

function SortableDealCard({ deal, onDealClick }: SortableDealCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <DealCard deal={deal} onDealClick={onDealClick} />
    </div>
  );
}

// Deal Card Component
interface DealCardProps {
  deal: Deal;
  onDealClick: (deal: Deal) => void;
}

function DealCard({ deal, onDealClick }: DealCardProps) {
  const [showExpanded, setShowExpanded] = useState(false);

  const getPriorityIcon = () => {
    switch (deal.priority) {
      case 'hot':
        return <Flame className="h-3 w-3 text-red-500" />;
      case 'warm':
        return <TrendingUp className="h-3 w-3 text-orange-500" />;
      case 'cold':
        return <Snowflake className="h-3 w-3 text-blue-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (deal.priority) {
      case 'hot':
        return 'border-l-red-500 bg-gradient-to-r from-red-50/30 to-transparent';
      case 'warm':
        return 'border-l-orange-500 bg-gradient-to-r from-orange-50/30 to-transparent';
      case 'cold':
        return 'border-l-blue-500 bg-gradient-to-r from-blue-50/30 to-transparent';
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-green-100 text-green-700';
      case 'email':
        return 'bg-purple-100 text-purple-700';
      case 'meeting':
      case 'showing':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-3 w-3" />;
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'meeting':
        return <User className="h-3 w-3" />;
      case 'showing':
        return <Eye className="h-3 w-3" />;
      default:
        return <ArrowRight className="h-3 w-3" />;
    }
  };

  const isOverdue = deal.nextAction.dueDate < new Date();
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
      className="mb-4 cursor-pointer"
    >
      <Card 
        className={`border-l-4 ${getPriorityColor()} hover:shadow-lg transition-all duration-200 overflow-hidden`}
        onClick={() => onDealClick(deal)}
      >
        <CardContent className="p-4">
          {/* Primary Info - Always Visible */}
          <div className="space-y-3">
            {/* Header with Client Name & Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={deal.clientAvatar} />
                  <AvatarFallback className="text-xs">{deal.clientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm truncate">{deal.clientName}</h3>
                  <p className="text-xs text-muted-foreground truncate">{deal.propertyAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getPriorityIcon()}
                <span className="text-lg font-bold text-green-600">{formatValue(deal.dealValue)}</span>
              </div>
            </div>

            {/* Stage Progress - Color-coded */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Stage Progress</span>
                <span className="text-xs font-semibold">{deal.probability}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    deal.probability >= 80 ? 'bg-green-500' :
                    deal.probability >= 60 ? 'bg-orange-500' :
                    deal.probability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${deal.probability}%` }}
                />
              </div>
            </div>

            {/* Next Action - Color Coded */}
            <div className="flex items-center justify-between">
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getActionColor(deal.nextAction.type)}`}>
                {getActionIcon(deal.nextAction.type)}
                <span>{deal.nextAction.type.replace('_', ' ')}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{deal.daysInStage}d in stage</p>
                {isOverdue && (
                  <p className="text-xs text-red-600 font-medium">Overdue!</p>
                )}
              </div>
            </div>

            {/* Expandable Footer */}
            {showExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border/50 pt-3 space-y-2"
              >
                <div className="text-xs text-muted-foreground">
                  <p><strong>Agent:</strong> {deal.assignedAgent}</p>
                  <p><strong>Type:</strong> {deal.propertyType}</p>
                  <p><strong>Next:</strong> {deal.nextAction.description}</p>
                  <p><strong>Due:</strong> {deal.nextAction.dueDate.toLocaleDateString()}</p>
                </div>
                {deal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {deal.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {deal.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{deal.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Expand/Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-6 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setShowExpanded(!showExpanded);
              }}
            >
              {showExpanded ? 'Show Less' : 'Show More'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PipelineKanbanView({ searchQuery, quickFilters, advancedFilters }: PipelineKanbanViewProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

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

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        // Fetch real pipeline data from API
        const response = await fetch('/api/pipeline/stages');
        if (!response.ok) throw new Error('Failed to fetch pipeline data');
        
        const { stages: apiStages } = await response.json();
        
        // Convert API data to component format
        const realDeals: Deal[] = [];
        const stageData: PipelineStage[] = [];
        
        apiStages.forEach((apiStage: any, index: number) => {
          // Convert API leads to Deal format
          const stageDeals: Deal[] = apiStage.leads.map((lead: any) => ({
            id: lead.id,
            title: lead.title || `${lead.contact?.name || 'Contact'} Deal`,
            clientName: lead.contact?.name || 'Unknown Contact',
            clientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.contact?.name || lead.id}`,
            propertyAddress: lead.property?.address || 'No address specified',
            propertyType: lead.property?.type || 'Single Family',
            dealValue: lead.value || 0,
            stage: apiStage.id,
            daysInStage: Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
            probability: lead.probability || 50,
            priority: lead.priority || 'warm',
            nextAction: {
              type: 'follow_up',
              description: lead.notes || 'Follow up required',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            },
            lastActivity: new Date(lead.updatedAt),
            assignedAgent: lead.assignedTo || 'Unassigned',
            leadSource: lead.source || 'Unknown',
            tags: lead.tags || [],
            createdAt: new Date(lead.createdAt),
            updatedAt: new Date(lead.updatedAt)
          }));
          
          realDeals.push(...stageDeals);
          
          // Create stage data
          const totalValue = stageDeals.reduce((sum, deal) => sum + deal.dealValue, 0);
          const avgDays = stageDeals.length > 0 
            ? stageDeals.reduce((sum, deal) => sum + deal.daysInStage, 0) / stageDeals.length 
            : 0;
          
          stageData.push({
            id: apiStage.id,
            title: apiStage.name,
            color: apiStage.color || PIPELINE_STAGES[index % PIPELINE_STAGES.length].color,
            bgColor: `${apiStage.color || PIPELINE_STAGES[index % PIPELINE_STAGES.length].color.replace('bg-', 'bg-').replace('-500', '-50')}`,
            deals: stageDeals,
            dealCount: stageDeals.length,
            totalValue,
            avgDaysInStage: Math.round(avgDays),
            conversionRate: 85 - (index * 15) // Rough conversion rate based on stage position
          });
        });
        
        // If no stages from API, use default empty stages
        if (stageData.length === 0) {
          const defaultStages = PIPELINE_STAGES.map(stage => ({
            ...stage,
            deals: [],
            dealCount: 0,
            totalValue: 0,
            avgDaysInStage: 0,
            conversionRate: 0
          }));
          setStages(defaultStages);
        } else {
          setStages(stageData);
        }
        
        setDeals(realDeals);
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
        
        // Fallback to empty pipeline stages
        const fallbackStages = PIPELINE_STAGES.map(stage => ({
          ...stage,
          deals: [],
          dealCount: 0,
          totalValue: 0,
          avgDaysInStage: 0,
          conversionRate: 0
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active deal
    const activeDeal = deals.find(deal => deal.id === activeId);
    if (!activeDeal) return;

    // Determine target stage
    let targetStage = overId;
    
    // If dropped on another deal, get that deal's stage
    const overDeal = deals.find(deal => deal.id === overId);
    if (overDeal) {
      targetStage = overDeal.stage;
    }

    // If dropped on a stage container
    const overStage = PIPELINE_STAGES.find(stage => stage.id === overId);
    if (overStage) {
      targetStage = overStage.id;
    }

    // Update deal stage if it changed
    if (activeDeal.stage !== targetStage) {
      const updatedDeals = deals.map(deal => 
        deal.id === activeId 
          ? { ...deal, stage: targetStage, daysInStage: 0, updatedAt: new Date() }
          : deal
      );
      
      setDeals(updatedDeals);

      // Update stages
      const updatedStages = PIPELINE_STAGES.map(stage => {
        const stageDeals = updatedDeals.filter(deal => deal.stage === stage.id);
        const totalValue = stageDeals.reduce((sum, deal) => sum + deal.dealValue, 0);
        
        return {
          ...stage,
          deals: stageDeals,
          dealCount: stageDeals.length,
          totalValue,
          avgDaysInStage: Math.round(stageDeals.reduce((sum, deal) => sum + deal.daysInStage, 0) / stageDeals.length || 0),
          conversionRate: Math.random() * 30 + 15
        };
      });
      
      setStages(updatedStages);
    }

    setActiveId(null);
  };

  const activeDeal = deals.find(deal => deal.id === activeId);

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
            case 'high-value':
              return deal.dealValue > 500000;
            case 'overdue':
              return deal.nextAction.dueDate < new Date();
            case 'this-week':
              const weekFromNow = new Date();
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              return deal.nextAction.dueDate <= weekFromNow;
            case 'hot-leads':
              return deal.priority === 'hot';
            case 'showing-scheduled':
              return deal.nextAction.type === 'showing';
            case 'first-time-buyer':
              return deal.tags.includes('First Time Buyer');
            default:
              return true;
          }
        });
      }

      return true;
    })
  }));

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-6">
          {filteredStages.map((stage) => (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80"
            >
              {/* Enhanced Stage Header */}
              <Card className={`mb-4 ${stage.bgColor} border-l-4 ${stage.color.replace('bg-', 'border-l-')} shadow-sm`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{stage.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold">{stage.dealCount}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 opacity-70 hover:opacity-100"
                        onClick={() => {/* Add deal to this stage */}}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">Total Value</span>
                        <span className="font-semibold text-green-600 text-sm">
                          ${stage.totalValue >= 1000000 ? `${(stage.totalValue / 1000000).toFixed(1)}M` : 
                            stage.totalValue >= 1000 ? `${(stage.totalValue / 1000).toFixed(0)}K` : 
                            stage.totalValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">Avg Days</span>
                        <span className="font-medium text-xs">{stage.avgDaysInStage}d</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">Conversion</span>
                        <span className="font-medium text-xs">{stage.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${stage.color}`}
                          style={{ width: `${Math.min(stage.conversionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Enhanced Deals Container with Stage Background */}
              <SortableContext items={stage.deals.map(deal => deal.id)} strategy={verticalListSortingStrategy}>
                <div
                  className={`min-h-[500px] p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${stage.bgColor}/20 ${
                    stage.deals.length === 0 
                      ? 'border-muted-foreground/30 hover:border-muted-foreground/50' 
                      : 'border-transparent'
                  }`}
                  id={stage.id}
                >
                  <AnimatePresence>
                    {stage.deals.map((deal) => (
                      <SortableDealCard
                        key={deal.id}
                        deal={deal}
                        onDealClick={setSelectedDeal}
                      />
                    ))}
                  </AnimatePresence>
                  
                  {/* Enhanced Empty State */}
                  {stage.deals.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center h-80 text-center space-y-4"
                    >
                      <div className={`w-16 h-16 rounded-full ${stage.bgColor} flex items-center justify-center border-2 border-dashed ${stage.color.replace('bg-', 'border-')}/50`}>
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">No deals in {stage.title}</p>
                        <p className="text-xs text-muted-foreground/70">Drag deals here or add a new one</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`border-dashed hover:${stage.bgColor} hover:border-solid transition-all duration-200`}
                        onClick={() => {/* Create new deal in this stage */}}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deal
                      </Button>
                    </motion.div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="rotate-3 opacity-90">
              <DealCard deal={activeDeal} onDealClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}