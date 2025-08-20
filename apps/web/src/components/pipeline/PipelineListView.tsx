"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Home,
  AlertTriangle
} from "lucide-react";

interface Deal {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyAddress: string;
  propertyType: 'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family' | 'Commercial' | 'Land';
  dealValue: number;
  stage: string;
  daysInStage: number;
  priority: 'hot' | 'warm' | 'cold';
  probability: number;
  assignedAgent: string;
  lastActivity: Date;
  nextAction: {
    type: 'call' | 'email' | 'meeting' | 'showing' | 'follow_up';
    description: string;
    dueDate: Date;
  };
}

interface FilterPill {
  id: string;
  label: string;
  count: number;
  active: boolean;
  color: string;
}

interface PipelineListViewProps {
  searchQuery: string;
  quickFilters: FilterPill[];
  advancedFilters: any;
}

type SortField = 'clientName' | 'dealValue' | 'stage' | 'daysInStage' | 'probability' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

export default function PipelineListView({ searchQuery, quickFilters, advancedFilters }: PipelineListViewProps) {
  const [sortField, setSortField] = useState<SortField>('dealValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');

  // Mock data - in real app, this would come from props or API
  const mockDeals: Deal[] = [
    {
      id: '1',
      clientName: 'Emily Rodriguez',
      clientEmail: 'emily.rodriguez@email.com',
      clientPhone: '(555) 123-4567',
      propertyAddress: '1234 Maple Street, Springfield, IL 62701',
      propertyType: 'Single Family',
      dealValue: 850000,
      stage: 'Under Contract',
      daysInStage: 5,
      priority: 'hot',
      probability: 90,
      assignedAgent: 'Sarah Johnson',
      lastActivity: new Date('2024-01-15'),
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
      clientPhone: '(555) 987-6543',
      propertyAddress: '567 Oak Avenue, Downtown, IL 62702',
      propertyType: 'Condo',
      dealValue: 425000,
      stage: 'Showing Scheduled',
      daysInStage: 2,
      priority: 'warm',
      probability: 65,
      assignedAgent: 'Mike Chen',
      lastActivity: new Date('2024-01-14'),
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
      clientPhone: '(555) 555-7890',
      propertyAddress: '890 Pine Lane, Suburbs, IL 62703',
      propertyType: 'Townhouse',
      dealValue: 675000,
      stage: 'Offer Made',
      daysInStage: 8,
      priority: 'hot',
      probability: 85,
      assignedAgent: 'Lisa Williams',
      lastActivity: new Date('2024-01-12'),
      nextAction: {
        type: 'follow_up',
        description: 'Counter-offer response deadline',
        dueDate: new Date('2024-01-16')
      }
    }
  ];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedDeals = () => {
    const sorted = [...mockDeals].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'lastActivity') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sorted;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-300';
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'cold': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Lead': return 'bg-gray-100 text-gray-800';
      case 'Qualified': return 'bg-blue-100 text-blue-800';
      case 'Showing Scheduled': return 'bg-purple-100 text-purple-800';
      case 'Offer Made': return 'bg-yellow-100 text-yellow-800';
      case 'Under Contract': return 'bg-orange-100 text-orange-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sortedDeals = getSortedDeals();

  return (
    <div className="space-y-4">
      {/* List Controls */}
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'compact' | 'detailed')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                {sortedDeals.length} deal{sortedDeals.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Total Value: {formatCurrency(sortedDeals.reduce((sum, deal) => sum + deal.dealValue, 0))}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-[200px]">
                  <Button variant="ghost" className="h-8 p-0 font-medium" onClick={() => handleSort('clientName')}>
                    Client
                    {getSortIcon('clientName')}
                  </Button>
                </TableHead>
                <TableHead className="w-[250px]">Property</TableHead>
                <TableHead className="w-[120px]">
                  <Button variant="ghost" className="h-8 p-0 font-medium" onClick={() => handleSort('dealValue')}>
                    Value
                    {getSortIcon('dealValue')}
                  </Button>
                </TableHead>
                <TableHead className="w-[140px]">
                  <Button variant="ghost" className="h-8 p-0 font-medium" onClick={() => handleSort('stage')}>
                    Stage
                    {getSortIcon('stage')}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">
                  <Button variant="ghost" className="h-8 p-0 font-medium" onClick={() => handleSort('probability')}>
                    Probability
                    {getSortIcon('probability')}
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">Agent</TableHead>
                <TableHead className="w-[200px]">Next Action</TableHead>
                <TableHead className="w-[100px]">
                  <Button variant="ghost" className="h-8 p-0 font-medium" onClick={() => handleSort('lastActivity')}>
                    Last Activity
                    {getSortIcon('lastActivity')}
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDeals.map((deal, index) => (
                <motion.tr
                  key={deal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-muted/50 border-border"
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{deal.clientName}</span>
                        <Badge className={`text-xs ${getPriorityColor(deal.priority)}`}>
                          <Star className="h-2 w-2 mr-1" />
                          {deal.priority}
                        </Badge>
                      </div>
                      {viewMode === 'detailed' && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{deal.clientEmail}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{deal.clientPhone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{deal.propertyAddress}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {deal.propertyType}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-semibold text-lg">
                      {formatCurrency(deal.dealValue)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={getStageColor(deal.stage)}>
                        {deal.stage}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {deal.daysInStage} day{deal.daysInStage !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" 
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{deal.probability}%</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{deal.assignedAgent}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getActionIcon(deal.nextAction.type)}
                        <span className="text-sm truncate max-w-[150px]">
                          {deal.nextAction.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Due: {formatDate(deal.nextAction.dueDate)}
                        {new Date(deal.nextAction.dueDate) < new Date() && (
                          <AlertTriangle className="h-3 w-3 text-red-500 ml-1" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(deal.lastActivity)}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Deal</DropdownMenuItem>
                        <DropdownMenuItem>Change Stage</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Schedule Activity</DropdownMenuItem>
                        <DropdownMenuItem>Add Note</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete Deal</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          
          {sortedDeals.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No deals found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters to see more deals.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}