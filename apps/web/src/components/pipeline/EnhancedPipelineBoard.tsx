"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Filter, 
  Search, 
  MoreHorizontal, 
  Target, 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckSquare, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  ArrowRight, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Users,
  Briefcase,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  value?: number;
  stage: string;
  owner?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  tags: string[];
  notes?: string;
  probability?: number;
  expectedCloseDate?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  leadCount: number;
  totalValue: number;
}

interface EnhancedPipelineBoardProps {
  searchQuery?: string;
  selectedFilters?: string[];
  viewMode?: 'board' | 'table' | 'analytics';
}

export default function EnhancedPipelineBoard({ 
  searchQuery = '', 
  selectedFilters = [], 
  viewMode = 'board' 
}: EnhancedPipelineBoardProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'board' | 'table' | 'analytics'>(viewMode);
  const [sortBy, setSortBy] = useState<'value' | 'date' | 'name'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedFilters.length > 0) params.append('filter', selectedFilters[0]); // API supports one filter at a time
        
        const response = await fetch(`/api/pipeline/leads?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setLeads(data.leads || []);
          
          // Create stages from the leads data
          const stageMap = new Map<string, { count: number; value: number }>();
          (data.leads || []).forEach((lead: Lead) => {
            const stage = lead.stage || 'Unknown';
            const current = stageMap.get(stage) || { count: 0, value: 0 };
            stageMap.set(stage, {
              count: current.count + 1,
              value: current.value + (lead.value || 0)
            });
          });

          const pipelineStages: PipelineStage[] = Array.from(stageMap.entries()).map(([name, stats], index) => ({
            id: `stage-${index}`,
            name,
            order: index,
            color: getStageColor(name),
            leadCount: stats.count,
            totalValue: stats.value
          }));

          setStages(pipelineStages);
        } else {
          setLeads([]);
          setStages([]);
        }
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
        setLeads([]);
        setStages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPipelineData();
  }, [searchQuery, selectedFilters]);

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'lead':
      case 'leads':
        return 'bg-blue-500';
      case 'prospect':
      case 'prospects':
        return 'bg-purple-500';
      case 'qualified':
      case 'qualified leads':
        return 'bg-green-500';
      case 'proposal':
      case 'proposals':
        return 'bg-orange-500';
      case 'negotiation':
      case 'negotiations':
        return 'bg-yellow-500';
      case 'closed':
      case 'closed won':
        return 'bg-emerald-500';
      case 'lost':
      case 'closed lost':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStageTextColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'lead':
      case 'leads':
        return 'text-blue-700 bg-blue-100';
      case 'prospect':
      case 'prospects':
        return 'text-purple-700 bg-purple-100';
      case 'qualified':
      case 'qualified leads':
        return 'text-green-700 bg-green-100';
      case 'proposal':
      case 'proposals':
        return 'text-orange-700 bg-orange-100';
      case 'negotiation':
      case 'negotiations':
        return 'text-yellow-700 bg-yellow-100';
      case 'closed':
      case 'closed won':
        return 'text-emerald-700 bg-emerald-100';
      case 'lost':
      case 'closed lost':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-slate-700 bg-slate-100';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getLeadsByStage = (stageName: string) => {
    return leads.filter(lead => lead.stage === stageName);
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'value':
        aValue = a.value || 0;
        bValue = b.value || 0;
        break;
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">


             {/* View Tabs */}
       <Tabs value={currentView} onValueChange={(value: string) => setCurrentView(value as 'board' | 'table' | 'analytics')} className="flex-1">
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="board">Board View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </div>

        {/* Board View */}
        <TabsContent value="board" className="flex-1 p-6">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Target className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No leads found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first lead'}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-full overflow-x-auto">
              {stages.map((stage) => (
                <div key={stage.id} className="flex flex-col min-w-80">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {stage.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {stage.leadCount}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {formatCurrency(stage.totalValue)}
                    </div>
                  </div>

                  {/* Stage Content */}
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-3 overflow-y-auto">
                    {getLeadsByStage(stage.name).map((lead) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowLeadModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                              {lead.name}
                            </h4>
                            {lead.company && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {lead.company}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>

                        {lead.value && (
                          <div className="text-lg font-semibold text-green-600 mb-2">
                            {formatCurrency(lead.value)}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{formatDate(lead.createdAt)}</span>
                          {lead.owner && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{lead.owner}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lead.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {lead.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{lead.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="flex-1 p-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-4 font-medium">Lead</th>
                      <th className="text-left p-4 font-medium">Company</th>
                      <th className="text-left p-4 font-medium">Stage</th>
                      <th className="text-left p-4 font-medium">Value</th>
                      <th className="text-left p-4 font-medium">Owner</th>
                      <th className="text-left p-4 font-medium">Created</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            {lead.email && (
                              <div className="text-sm text-slate-600 dark:text-slate-400">{lead.email}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {lead.company || '-'}
                        </td>
                        <td className="p-4">
                          <Badge className={cn("text-xs", getStageTextColor(lead.stage))}>
                            {lead.stage}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium">
                          {formatCurrency(lead.value)}
                        </td>
                        <td className="p-4">
                          {lead.owner || '-'}
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics View */}
        <TabsContent value="analytics" className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pipeline Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Pipeline Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Leads</span>
                    <span className="font-semibold">{leads.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Value</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(leads.reduce((sum, lead) => sum + (lead.value || 0), 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Avg Deal Size</span>
                    <span className="font-semibold">
                      {leads.length > 0 
                        ? formatCurrency(leads.reduce((sum, lead) => sum + (lead.value || 0), 0) / leads.length)
                        : '$0'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Stage Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stages.map((stage) => (
                    <div key={stage.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                        <span className="text-sm">{stage.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{stage.leadCount}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {formatCurrency(stage.totalValue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", getStageColor(lead.stage))} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{lead.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {formatDate(lead.updatedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Lead Modal */}
      <AnimatePresence>
        {showLeadModal && selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowLeadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{selectedLead.name}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowLeadModal(false)}>
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Lead Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Company</label>
                    <p className="text-slate-900 dark:text-slate-100">{selectedLead.company || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Value</label>
                    <p className="text-slate-900 dark:text-slate-100 font-semibold">
                      {formatCurrency(selectedLead.value)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Stage</label>
                    <Badge className={cn("mt-1", getStageTextColor(selectedLead.stage))}>
                      {selectedLead.stage}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Owner</label>
                    <p className="text-slate-900 dark:text-slate-100">{selectedLead.owner || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
                    <p className="text-slate-900 dark:text-slate-100">{selectedLead.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Phone</label>
                    <p className="text-slate-900 dark:text-slate-100">{selectedLead.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Tags */}
                {selectedLead.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLead.notes && (
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Notes</label>
                    <p className="text-slate-900 dark:text-slate-100">{selectedLead.notes}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button size="sm" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button size="sm" variant="outline">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Lead
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
