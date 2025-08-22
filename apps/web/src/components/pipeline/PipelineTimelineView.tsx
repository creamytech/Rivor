"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Star,
  Clock,
  TrendingUp,
  MoreHorizontal,
  Home,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Target,
  Activity
} from "lucide-react";

interface Deal {
  id: string;
  clientName: string;
  clientEmail: string;
  propertyAddress: string;
  propertyType: 'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family' | 'Commercial' | 'Land';
  dealValue: number;
  stage: string;
  priority: 'hot' | 'warm' | 'cold';
  probability: number;
  assignedAgent: string;
  createdDate: Date;
  stageHistory: StageEntry[];
  nextAction: {
    type: 'call' | 'email' | 'meeting' | 'showing' | 'follow_up';
    description: string;
    dueDate: Date;
  };
}

interface StageEntry {
  stage: string;
  enteredDate: Date;
  duration?: number; // days in this stage
  notes?: string;
  completed: boolean;
}

interface FilterPill {
  id: string;
  label: string;
  count: number;
  active: boolean;
  color: string;
}

interface PipelineTimelineViewProps {
  searchQuery: string;
  quickFilters: FilterPill[];
  advancedFilters: any;
}

type TimelineGrouping = 'stage' | 'agent' | 'month';

export default function PipelineTimelineView({ searchQuery, quickFilters, advancedFilters }: PipelineTimelineViewProps) {
  const [groupBy, setGroupBy] = useState<TimelineGrouping>('stage');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const pipelineStages = ['Lead', 'Qualified', 'Showing Scheduled', 'Offer Made', 'Under Contract', 'Closed'];

  // Mock data - in real app, this would come from props or API
  const mockDeals: Deal[] = [
    {
      id: '1',
      clientName: 'Emily Rodriguez',
      clientEmail: 'emily.rodriguez@email.com',
      propertyAddress: '1234 Maple Street, Springfield, IL',
      propertyType: 'Single Family',
      dealValue: 850000,
      stage: 'Under Contract',
      priority: 'hot',
      probability: 90,
      assignedAgent: 'Sarah Johnson',
      createdDate: new Date('2024-01-01'),
      stageHistory: [
        { stage: 'Lead', enteredDate: new Date('2024-01-01'), duration: 3, completed: true },
        { stage: 'Qualified', enteredDate: new Date('2024-01-04'), duration: 5, completed: true },
        { stage: 'Showing Scheduled', enteredDate: new Date('2024-01-09'), duration: 2, completed: true },
        { stage: 'Offer Made', enteredDate: new Date('2024-01-11'), duration: 4, completed: true },
        { stage: 'Under Contract', enteredDate: new Date('2024-01-15'), duration: 5, completed: false },
        { stage: 'Closed', enteredDate: new Date(), completed: false }
      ],
      nextAction: {
        type: 'call',
        description: 'Follow up on inspection results',
        dueDate: new Date('2024-01-16')
      }
    },
    {
      id: '2',
      clientName: 'Marcus Thompson',
      clientEmail: 'marcus.t@email.com',
      propertyAddress: '567 Oak Avenue, Downtown, IL',
      propertyType: 'Condo',
      dealValue: 425000,
      stage: 'Showing Scheduled',
      priority: 'warm',
      probability: 65,
      assignedAgent: 'Mike Chen',
      createdDate: new Date('2024-01-08'),
      stageHistory: [
        { stage: 'Lead', enteredDate: new Date('2024-01-08'), duration: 2, completed: true },
        { stage: 'Qualified', enteredDate: new Date('2024-01-10'), duration: 4, completed: true },
        { stage: 'Showing Scheduled', enteredDate: new Date('2024-01-14'), duration: 2, completed: false },
        { stage: 'Offer Made', enteredDate: new Date(), completed: false },
        { stage: 'Under Contract', enteredDate: new Date(), completed: false },
        { stage: 'Closed', enteredDate: new Date(), completed: false }
      ],
      nextAction: {
        type: 'showing',
        description: 'Property showing with client',
        dueDate: new Date('2024-01-17')
      }
    },
    {
      id: '3',
      clientName: 'Sarah Williams',
      clientEmail: 'sarah.w@email.com',
      propertyAddress: '890 Pine Lane, Suburbs, IL',
      propertyType: 'Townhouse',
      dealValue: 675000,
      stage: 'Offer Made',
      priority: 'hot',
      probability: 85,
      assignedAgent: 'Lisa Williams',
      createdDate: new Date('2024-01-05'),
      stageHistory: [
        { stage: 'Lead', enteredDate: new Date('2024-01-05'), duration: 1, completed: true },
        { stage: 'Qualified', enteredDate: new Date('2024-01-06'), duration: 3, completed: true },
        { stage: 'Showing Scheduled', enteredDate: new Date('2024-01-09'), duration: 1, completed: true },
        { stage: 'Offer Made', enteredDate: new Date('2024-01-10'), duration: 8, completed: false },
        { stage: 'Under Contract', enteredDate: new Date(), completed: false },
        { stage: 'Closed', enteredDate: new Date(), completed: false }
      ],
      nextAction: {
        type: 'follow_up',
        description: 'Counter-offer response deadline',
        dueDate: new Date('2024-01-16')
      }
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-300';
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'cold': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStageColor = (stage: string, completed: boolean) => {
    if (!completed) return 'border-gray-300 bg-gray-50';
    
    switch (stage) {
      case 'Lead': return 'border-gray-400 bg-gray-100';
      case 'Qualified': return 'border-blue-400 bg-blue-100';
      case 'Showing Scheduled': return 'border-purple-400 bg-purple-100';
      case 'Offer Made': return 'border-yellow-400 bg-yellow-100';
      case 'Under Contract': return 'border-orange-400 bg-orange-100';
      case 'Closed': return 'border-green-400 bg-green-100';
      default: return 'border-gray-400 bg-gray-100';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      case 'meeting': return <Calendar className="h-3 w-3" />;
      case 'showing': return <Home className="h-3 w-3" />;
      case 'follow_up': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTimelineItem = (deal: Deal, index: number) => (
    <motion.div
      key={deal.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      <Card className="glass-card glass-hover-tilt">
        <CardContent className="p-6">
          {/* Deal Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{deal.clientName}</h3>
                <Badge className={`text-xs ${getPriorityColor(deal.priority)}`}>
                  <Star className="h-2 w-2 mr-1" />
                  {deal.priority}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {deal.assignedAgent}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{deal.propertyAddress}</span>
                <span className="px-2 py-1 bg-muted rounded text-xs">
                  {deal.propertyType}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 font-semibold text-lg">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(deal.dealValue)}
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{deal.probability}% probability</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Started {formatDate(deal.createdDate)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Edit Deal</DropdownMenuItem>
                  <DropdownMenuItem>Move to Stage</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Schedule Activity</DropdownMenuItem>
                  <DropdownMenuItem>Add Note</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">Delete Deal</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Pipeline Timeline */}
          <div className="relative">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {deal.stageHistory.map((stageEntry, stageIndex) => (
                <div key={stageIndex} className="flex items-center gap-2 flex-shrink-0">
                  {/* Stage Circle */}
                  <div className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full border-2 
                    ${getStageColor(stageEntry.stage, stageEntry.completed)}
                    ${stageEntry.completed ? 'shadow-sm' : ''}
                  `}>
                    {stageEntry.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Stage Info */}
                  <div className="flex flex-col items-start min-w-[120px]">
                    <span className={`text-xs font-medium ${
                      stageEntry.completed ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {stageEntry.stage}
                    </span>
                    {stageEntry.completed && stageEntry.duration && (
                      <span className="text-xs text-muted-foreground">
                        {stageEntry.duration} day{stageEntry.duration !== 1 ? 's' : ''}
                      </span>
                    )}
                    {stageEntry.completed && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(stageEntry.enteredDate)}
                      </span>
                    )}
                  </div>
                  
                  {/* Arrow */}
                  {stageIndex < deal.stageHistory.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Next Action */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm">
                  {getActionIcon(deal.nextAction.type)}
                  <span className="font-medium">Next:</span>
                  <span>{deal.nextAction.description}</span>
                </div>
                {new Date(deal.nextAction.dueDate) < new Date() && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                Due {formatDate(deal.nextAction.dueDate)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const groupedDeals = groupBy === 'agent' 
    ? mockDeals.reduce((acc, deal) => {
        if (!acc[deal.assignedAgent]) acc[deal.assignedAgent] = [];
        acc[deal.assignedAgent].push(deal);
        return acc;
      }, {} as Record<string, Deal[]>)
    : groupBy === 'stage'
    ? mockDeals.reduce((acc, deal) => {
        if (!acc[deal.stage]) acc[deal.stage] = [];
        acc[deal.stage].push(deal);
        return acc;
      }, {} as Record<string, Deal[]>)
    : { 'All Deals': mockDeals };

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <Card className="glass-card glass-hover-tilt">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Group by:</span>
                <Select value={groupBy} onValueChange={(value) => setGroupBy(value as TimelineGrouping)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage">Stage</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Time range:</span>
                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="quarter">Quarter</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                {mockDeals.length} active deal{mockDeals.length !== 1 ? 's' : ''}
              </div>
              <Badge variant="outline" className="text-xs">
                Pipeline Value: {formatCurrency(mockDeals.reduce((sum, deal) => sum + deal.dealValue, 0))}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Content */}
      <div className="space-y-6">
        {Object.entries(groupedDeals).map(([groupName, deals]) => (
          <motion.div
            key={groupName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {groupBy !== 'month' && (
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <h2 className="text-lg font-semibold">{groupName}</h2>
                <Badge variant="secondary" className="text-xs">
                  {deals.length} deal{deals.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatCurrency(deals.reduce((sum, deal) => sum + deal.dealValue, 0))}
                </Badge>
              </div>
            )}
            
            <div className="space-y-4">
              {deals.map((deal, index) => renderTimelineItem(deal, index))}
            </div>
          </motion.div>
        ))}
      </div>

      {mockDeals.length === 0 && (
        <Card className="glass-card glass-hover-tilt">
          <CardContent className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No deals in timeline</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters to see timeline data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}