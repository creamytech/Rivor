"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DollarSign,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  TrendingUp,
  Flame,
  Snowflake,
  ArrowUpDown,
  Filter,
  MoreHorizontal
} from "lucide-react";

interface Deal {
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
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface PipelineListViewProps {
  searchQuery: string;
  quickFilters: any[];
  advancedFilters: any;
}

type SortField = 'clientName' | 'dealValue' | 'probability' | 'stage' | 'daysInStage' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const STAGE_NAMES = {
  'prospect': 'Prospects',
  'qualified': 'Qualified',
  'showing': 'Active Showing',
  'negotiating': 'Negotiating',
  'contract': 'Under Contract',
  'closing': 'Closing'
};

export default function PipelineListView({ searchQuery, quickFilters, advancedFilters }: PipelineListViewProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pipeline/stages');
      if (!response.ok) throw new Error('Failed to fetch pipeline data');
      
      const { stages } = await response.json();
      
      // Flatten all deals from all stages
      const allDeals: Deal[] = [];
      stages.forEach((stage: any) => {
        if (stage.leads) {
          stage.leads.forEach((lead: any) => {
            allDeals.push({
              id: lead.id,
              title: lead.title || `${lead.contact?.name || 'Contact'} Deal`,
              clientName: lead.contact?.name || 'Unknown Contact',
              clientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.contact?.name || lead.id}`,
              propertyAddress: lead.property?.address || '123 Main St, City, State',
              propertyType: lead.property?.type || 'Single Family',
              dealValue: lead.value || Math.floor(Math.random() * 500000) + 200000,
              stage: stage.id,
              daysInStage: Math.floor((Date.now() - new Date(lead.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
              probability: lead.probability || Math.floor(Math.random() * 80) + 20,
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
            });
          });
        }
      });
      
      setDeals(allDeals);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return (
      <ArrowUpDown 
        className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform`} 
        style={{ color: 'var(--glass-primary)' }}
      />
    );
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'hot':
        return { 
          icon: <Flame className="h-3 w-3" />, 
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          label: 'Hot'
        };
      case 'warm':
        return { 
          icon: <TrendingUp className="h-3 w-3" />, 
          color: 'text-orange-500',
          bg: 'bg-orange-500/10',
          label: 'Warm'
        };
      case 'cold':
        return { 
          icon: <Snowflake className="h-3 w-3" />, 
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          label: 'Cold'
        };
      default:
        return { 
          icon: <TrendingUp className="h-3 w-3" />, 
          color: 'text-gray-500',
          bg: 'bg-gray-500/10',
          label: 'Normal'
        };
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospect': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'qualified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'showing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'negotiating': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'contract': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'closing': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Apply filters and sorting
  const filteredAndSortedDeals = deals
    .filter(deal => {
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
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle different data types
      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold glass-text-glow">Pipeline List</h2>
          <p style={{ color: 'var(--glass-text-muted)' }}>
            {filteredAndSortedDeals.length} deals in your pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card glass-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="glass-border-bottom">
              <TableHead className="w-12">#</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-glass-hover transition-colors"
                onClick={() => handleSort('clientName')}
              >
                <div className="flex items-center gap-2">
                  Client
                  {getSortIcon('clientName')}
                </div>
              </TableHead>
              <TableHead>Property</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-glass-hover transition-colors"
                onClick={() => handleSort('dealValue')}
              >
                <div className="flex items-center gap-2">
                  Value
                  {getSortIcon('dealValue')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-glass-hover transition-colors"
                onClick={() => handleSort('stage')}
              >
                <div className="flex items-center gap-2">
                  Stage
                  {getSortIcon('stage')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-glass-hover transition-colors"
                onClick={() => handleSort('probability')}
              >
                <div className="flex items-center gap-2">
                  Probability
                  {getSortIcon('probability')}
                </div>
              </TableHead>
              <TableHead>Priority</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-glass-hover transition-colors"
                onClick={() => handleSort('daysInStage')}
              >
                <div className="flex items-center gap-2">
                  Days in Stage
                  {getSortIcon('daysInStage')}
                </div>
              </TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredAndSortedDeals.map((deal, index) => {
                const priorityConfig = getPriorityConfig(deal.priority);
                const isOverdue = deal.nextAction.dueDate < new Date();
                
                return (
                  <motion.tr
                    key={deal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    className="glass-hover cursor-pointer transition-colors"
                  >
                    <TableCell className="font-medium text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                      {index + 1}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={deal.clientAvatar} />
                          <AvatarFallback className="text-xs">
                            {deal.clientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium glass-text-glow">{deal.clientName}</div>
                          <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                            {deal.leadSource}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{deal.propertyAddress}</span>
                        </div>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {deal.propertyType}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-bold text-emerald-600">
                        {formatValue(deal.dealValue)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`text-xs ${getStageColor(deal.stage)}`}>
                        {STAGE_NAMES[deal.stage as keyof typeof STAGE_NAMES] || deal.stage}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              deal.probability >= 80 ? 'bg-green-500' :
                              deal.probability >= 60 ? 'bg-orange-500' :
                              deal.probability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{deal.probability}%</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${priorityConfig.bg} ${priorityConfig.color}`}>
                        {priorityConfig.icon}
                        <span>{priorityConfig.label}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{deal.daysInStage}d</div>
                        {isOverdue && (
                          <div className="text-xs text-red-500 font-bold">Overdue!</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">{deal.assignedAgent}</div>
                    </TableCell>
                    
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
        
        {filteredAndSortedDeals.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--glass-text-muted)' }} />
            <h3 className="text-lg font-medium glass-text-glow mb-2">No deals found</h3>
            <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
              Try adjusting your search or filters to see more deals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}