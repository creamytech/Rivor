"use client";
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
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
import { 
  Filter, 
  Search, 
  Users, 
  BarChart3, 
  MoreHorizontal,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  User,
  Building,
  Home,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share2
} from 'lucide-react';

interface Lead {
  id: string;
  title: string | null;
  status: string;
  priority: string;
  source: string | null;
  probabilityPercent: number | null;
  expectedCloseDate: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: {
    id: string;
    nameEnc?: any;
    emailEnc?: any;
    companyEnc?: any;
  } | null;
  assignedTo?: {
    id: string;
    user: {
      name: string | null;
      email: string;
    };
  } | null;
  stage?: {
    id: string;
    name: string;
    color: string | null;
    order: number;
  } | null;
  tasks?: Array<{
    id: string;
    title: string;
    dueAt: string | null;
    done: boolean;
  }>;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string | null;
  order: number;
  _count: {
    leads: number;
  };
}

interface EnhancedPipelineBoardProps {
  className?: string;
}

export default function EnhancedPipelineBoard({ className = '' }: EnhancedPipelineBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [groupBy, setGroupBy] = useState<'stage' | 'owner' | 'source'>('stage');
  const [filterIntent, setFilterIntent] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');

  // Fetch real data from tRPC
  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = trpc.leads.list.useQuery({
    search: searchQuery || undefined,
    limit: 100
  });

  const { data: stagesData, isLoading: stagesLoading } = trpc.pipelineStages.list.useQuery();

  // Mutations
  const updateLeadMutation = trpc.leads.update.useMutation({
    onSuccess: () => refetchLeads()
  });

  const leads = leadsData?.leads || [];
  const stages = stagesData || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  const getIntentFromTitle = (title: string | null): 'buyer' | 'seller' | 'renter' => {
    if (!title) return 'buyer';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('sell') || lowerTitle.includes('listing')) return 'seller';
    if (lowerTitle.includes('rent') || lowerTitle.includes('lease')) return 'renter';
    return 'buyer';
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'buyer': return <Home className="h-3 w-3" />;
      case 'seller': return <Building className="h-3 w-3" />;
      case 'renter': return <User className="h-3 w-3" />;
      default: return <Target className="h-3 w-3" />;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeLead = leads.find(lead => lead.id === active.id);
      const targetStage = stages.find(stage => stage.id === over.id);

      if (activeLead && targetStage) {
        updateLeadMutation.mutate({
          id: activeLead.id,
          stageId: targetStage.id
        });
      }
    }
  };

  const handleBulkAction = (action: 'move' | 'assign' | 'delete') => {
    selectedLeads.forEach(leadId => {
      if (action === 'delete') {
        // Add delete mutation
        console.log('Delete lead:', leadId);
      }
      // Add other bulk actions as needed
    });
    setSelectedLeads(new Set());
  };

  const handleLeadToggle = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const filteredLeads = leads.filter(lead => {
    if (filterIntent !== 'all') {
      const intent = getIntentFromTitle(lead.title);
      if (intent !== filterIntent) return false;
    }
    if (filterAgent !== 'all' && lead.assignedTo?.user.email !== filterAgent) {
      return false;
    }
    return true;
  });

  const groupedLeads = filteredLeads.reduce((acc, lead) => {
    let key = 'unassigned';
    if (groupBy === 'stage') {
      key = lead.stage?.id || 'unassigned';
    } else if (groupBy === 'owner') {
      key = lead.assignedTo?.user.email || 'unassigned';
    } else if (groupBy === 'source') {
      key = lead.source || 'unassigned';
    }
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(lead);
    return acc;
  }, {} as Record<string, Lead[]>);

  if (leadsLoading || stagesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Pipeline
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your deals and track progress
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Intent:</span>
              <select
                value={filterIntent}
                onChange={(e) => setFilterIntent(e.target.value)}
                className="text-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="renter">Renter</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Agent:</span>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="text-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 rounded px-2 py-1"
              >
                <option value="all">All</option>
                {Array.from(new Set(leads.map(lead => lead.assignedTo?.user.email).filter(Boolean))).map(email => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Group by:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'stage' | 'owner' | 'source')}
                className="text-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 rounded px-2 py-1"
              >
                <option value="stage">Stage</option>
                <option value="owner">Owner</option>
                <option value="source">Source</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedLeads.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedLeads.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('move')}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                Move
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('assign')}
              >
                <Users className="h-4 w-4 mr-1" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Pipeline Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {groupBy === 'stage' ? (
              // Kanban view by stage
              stages.map((stage) => {
                const stageLeads = filteredLeads.filter(lead => lead.stage?.id === stage.id);
                const avgDaysInStage = 5; // This would be calculated from real data
                const conversionRate = 75; // This would be calculated from real data

                return (
                  <GlassCard key={stage.id} variant="gradient" intensity="medium" className="h-full">
                    <GlassCardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <GlassCardTitle className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color || '#6366f1' }}
                            />
                            {stage.name}
                          </GlassCardTitle>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-600 dark:text-slate-400">
                            <span>{stageLeads.length} leads</span>
                            <span>• {avgDaysInStage}d avg</span>
                            <span>• {conversionRate}% conv</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent className="p-0">
                      <SortableContext items={stageLeads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2 p-2 max-h-[600px] overflow-y-auto">
                          {stageLeads.map((lead) => {
                            const intent = getIntentFromTitle(lead.title);
                            const nextTask = lead.tasks?.find(task => !task.done);

                            return (
                              <div
                                key={lead.id}
                                className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-white/20 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                              >
                                <div className="flex items-start gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedLeads.has(lead.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleLeadToggle(lead.id);
                                    }}
                                    className="mt-1"
                                  />
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                                        {lead.title || 'Untitled Lead'}
                                      </h4>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge
                                        variant="secondary"
                                        className={`text-xs ${getIntentColor(intent)}`}
                                      >
                                        {getIntentIcon(intent)}
                                        <span className="ml-1 capitalize">{intent}</span>
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${getPriorityColor(lead.priority)}`}
                                      >
                                        {lead.priority}
                                      </Badge>
                                      {lead.probabilityPercent && (
                                        <Badge variant="outline" className="text-xs">
                                          {lead.probabilityPercent}%
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                      <div className="flex items-center gap-2">
                                        {lead.assignedTo ? (
                                          <Avatar className="h-5 w-5">
                                            <AvatarFallback className="text-xs">
                                              {lead.assignedTo.user.name?.charAt(0) || lead.assignedTo.user.email.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                        ) : (
                                          <User className="h-3 w-3" />
                                        )}
                                        <span className="truncate">
                                          {lead.assignedTo?.user.name || lead.assignedTo?.user.email || 'Unassigned'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {getTimeAgo(lead.updatedAt)}
                                      </div>
                                    </div>

                                    {nextTask && (
                                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                                        <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-300">
                                          <Calendar className="h-3 w-3" />
                                          Next: {nextTask.title}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </SortableContext>
                    </GlassCardContent>
                  </GlassCard>
                );
              })
            ) : (
              // List view grouped by owner or source
              Object.entries(groupedLeads).map(([key, groupLeads]) => (
                <GlassCard key={key} variant="gradient" intensity="medium" className="h-full">
                  <GlassCardHeader className="pb-3">
                    <GlassCardTitle>
                      {groupBy === 'owner' ? (key === 'unassigned' ? 'Unassigned' : key) :
                       groupBy === 'source' ? (key === 'unassigned' ? 'Unknown Source' : key) : key}
                    </GlassCardTitle>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {groupLeads.length} leads
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="p-0">
                    <div className="space-y-2 p-2 max-h-[600px] overflow-y-auto">
                      {groupLeads.map((lead) => {
                        const intent = getIntentFromTitle(lead.title);
                        const nextTask = lead.tasks?.find(task => !task.done);

                        return (
                          <div
                            key={lead.id}
                            className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-white/20 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selectedLeads.has(lead.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleLeadToggle(lead.id);
                                }}
                                className="mt-1"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                                    {lead.title || 'Untitled Lead'}
                                  </h4>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${getIntentColor(intent)}`}
                                  >
                                    {getIntentIcon(intent)}
                                    <span className="ml-1 capitalize">{intent}</span>
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getPriorityColor(lead.priority)}`}
                                  >
                                    {lead.priority}
                                  </Badge>
                                  {lead.stage && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        borderColor: lead.stage.color || undefined,
                                        color: lead.stage.color || undefined
                                      }}
                                    >
                                      {lead.stage.name}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                  <div className="flex items-center gap-2">
                                    {lead.assignedTo ? (
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs">
                                          {lead.assignedTo.user.name?.charAt(0) || lead.assignedTo.user.email.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <User className="h-3 w-3" />
                                    )}
                                    <span className="truncate">
                                      {lead.assignedTo?.user.name || lead.assignedTo?.user.email || 'Unassigned'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {getTimeAgo(lead.updatedAt)}
                                  </div>
                                </div>

                                {nextTask && (
                                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                                    <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-300">
                                      <Calendar className="h-3 w-3" />
                                      Next: {nextTask.title}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))
            )}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
