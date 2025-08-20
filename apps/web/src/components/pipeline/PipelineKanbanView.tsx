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

// Mock data generator
const generateMockDeals = (): Deal[] => {
  const clientNames = ['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Wilson', 'Lisa Thompson', 'Robert Lee', 'Amanda Davis', 'Christopher Brown', 'Jessica Miller', 'Andrew Garcia'];
  const propertyAddresses = ['123 Oak Street', '456 Pine Avenue', '789 Maple Drive', '321 Cedar Lane', '654 Elm Street', '987 Birch Road', '147 Willow Way', '258 Spruce Street', '369 Ash Boulevard', '741 Cherry Lane'];
  const propertyTypes: Deal['propertyType'][] = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Commercial'];
  const priorities: Deal['priority'][] = ['hot', 'warm', 'cold'];
  const agents = ['John Smith', 'Mary Johnson', 'Tom Wilson', 'Lisa Davis'];
  const sources = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Open House'];

  return clientNames.map((name, index) => ({
    id: `deal-${index + 1}`,
    title: `${propertyAddresses[index]} Sale`,
    clientName: name,
    clientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    propertyAddress: propertyAddresses[index],
    propertyType: propertyTypes[index % propertyTypes.length],
    dealValue: 250000 + (index * 75000) + Math.floor(Math.random() * 500000),
    stage: ['lead', 'qualified', 'showing', 'offer', 'contract', 'closed'][Math.floor(Math.random() * 6)],
    daysInStage: Math.floor(Math.random() * 45) + 1,
    probability: Math.floor(Math.random() * 100),
    priority: priorities[index % priorities.length],
    nextAction: {
      type: ['call', 'email', 'meeting', 'showing', 'follow_up'][index % 5] as Deal['nextAction']['type'],
      description: 'Follow up on property tour feedback',
      dueDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)
    },
    lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    assignedAgent: agents[index % agents.length],
    leadSource: sources[index % sources.length],
    tags: ['First Time Buyer', 'Investment', 'Relocation'].slice(0, Math.floor(Math.random() * 3) + 1),
    createdAt: new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
  }));
};

const PIPELINE_STAGES = [
  { id: 'lead', title: 'New Lead', color: 'bg-slate-500', bgColor: 'bg-slate-50' },
  { id: 'qualified', title: 'Qualified', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { id: 'showing', title: 'Showing Scheduled', color: 'bg-purple-500', bgColor: 'bg-purple-50' },
  { id: 'offer', title: 'Offer Made', color: 'bg-orange-500', bgColor: 'bg-orange-50' },
  { id: 'contract', title: 'Under Contract', color: 'bg-green-500', bgColor: 'bg-green-50' },
  { id: 'closed', title: 'Closed', color: 'bg-emerald-500', bgColor: 'bg-emerald-50' }
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
  const getPriorityIcon = () => {
    switch (deal.priority) {
      case 'hot':
        return <Flame className="h-4 w-4 text-red-500" />;
      case 'warm':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'cold':
        return <Snowflake className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (deal.priority) {
      case 'hot':
        return 'border-l-red-500 bg-red-50/50';
      case 'warm':
        return 'border-l-orange-500 bg-orange-50/50';
      case 'cold':
        return 'border-l-blue-500 bg-blue-50/50';
    }
  };

  const getNextActionIcon = () => {
    switch (deal.nextAction.type) {
      case 'call':
        return <Phone className="h-3 w-3" />;
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'meeting':
        return <User className="h-3 w-3" />;
      case 'showing':
        return <Eye className="h-3 w-3" />;
      case 'follow_up':
        return <ArrowRight className="h-3 w-3" />;
    }
  };

  const isOverdue = deal.nextAction.dueDate < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`mb-3 cursor-pointer`}
    >
      <Card 
        className={`border-l-4 ${getPriorityColor()} hover:shadow-lg transition-all duration-200`}
        onClick={() => onDealClick(deal)}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={deal.clientAvatar} />
                <AvatarFallback>{deal.clientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{deal.clientName}</h3>
                <p className="text-xs text-muted-foreground">{deal.assignedAgent}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getPriorityIcon()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Client
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Showing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Mark as Lost
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Property Details */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{deal.propertyAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{deal.propertyType}</span>
            </div>
          </div>

          {/* Deal Value */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-600">
                ${deal.dealValue.toLocaleString()}
              </span>
              <Badge variant="outline" className="text-xs">
                {deal.probability}% prob
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs text-muted-foreground">{deal.probability}%</span>
            </div>
            <Progress value={deal.probability} className="h-2" />
          </div>

          {/* Days in Stage */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {deal.daysInStage} days in stage
              </span>
            </div>
          </div>

          {/* Next Action */}
          <div className={`p-2 rounded border-l-2 ${isOverdue ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              {getNextActionIcon()}
              <span className={`text-xs font-medium ${isOverdue ? 'text-red-700' : 'text-blue-700'}`}>
                {deal.nextAction.type.replace('_', ' ').toUpperCase()}
              </span>
              {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {deal.nextAction.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Due: {deal.nextAction.dueDate.toLocaleDateString()}
            </p>
          </div>

          {/* Tags */}
          {deal.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {deal.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {deal.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{deal.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
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
    const mockDeals = generateMockDeals();
    setDeals(mockDeals);

    // Group deals by stage
    const stageData = PIPELINE_STAGES.map(stage => {
      const stageDeals = mockDeals.filter(deal => deal.stage === stage.id);
      const totalValue = stageDeals.reduce((sum, deal) => sum + deal.dealValue, 0);
      const avgDays = stageDeals.length > 0 
        ? stageDeals.reduce((sum, deal) => sum + deal.daysInStage, 0) / stageDeals.length 
        : 0;

      return {
        ...stage,
        deals: stageDeals,
        dealCount: stageDeals.length,
        totalValue,
        avgDaysInStage: Math.round(avgDays),
        conversionRate: Math.random() * 30 + 15 // Mock conversion rate
      };
    });

    setStages(stageData);
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
              {/* Stage Header */}
              <Card className={`mb-4 ${stage.bgColor} border-l-4 ${stage.color.replace('bg-', 'border-l-')}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{stage.title}</CardTitle>
                    <Badge variant="secondary">{stage.dealCount}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Value</span>
                      <span className="font-semibold text-green-600">
                        ${stage.totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avg Days</span>
                      <span className="font-medium">{stage.avgDaysInStage} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Conversion</span>
                      <span className="font-medium">{stage.conversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Deals Container */}
              <SortableContext items={stage.deals.map(deal => deal.id)} strategy={verticalListSortingStrategy}>
                <div
                  className="min-h-[400px] p-2 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
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
                  
                  {stage.deals.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Target className="h-8 w-8 mb-2" />
                      <p className="text-sm">No deals in this stage</p>
                    </div>
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