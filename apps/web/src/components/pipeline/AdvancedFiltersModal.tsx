"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Filter,
  DollarSign,
  Calendar,
  User,
  Home,
  TrendingUp,
  Clock,
  Star,
  X,
  RotateCcw
} from "lucide-react";

interface FilterState {
  dealStage: string;
  propertyType: string;
  priceRange: { min: string; max: string };
  daysInStage: string;
  assignedAgent: string;
  leadSource: string;
  dealProbability: string;
  lastActivity: string;
}

interface AdvancedFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: (selectedFilters: string[]) => void;
}

export default function AdvancedFiltersModal({ 
  open, 
  onOpenChange, 
  filters, 
  onFiltersChange, 
  onApplyFilters 
}: AdvancedFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const updatePriceRange = (field: 'min' | 'max', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: { ...prev.priceRange, [field]: value }
    }));
  };

  const resetFilters = () => {
    const emptyFilters: FilterState = {
      dealStage: '',
      propertyType: '',
      priceRange: { min: '', max: '' },
      daysInStage: '',
      assignedAgent: '',
      leadSource: '',
      dealProbability: '',
      lastActivity: ''
    };
    setLocalFilters(emptyFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    Object.entries(localFilters).forEach(([key, value]) => {
      if (key === 'priceRange') {
        if (value.min || value.max) count++;
      } else if (value) {
        count++;
      }
    });
    return count;
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    
    // Generate selected filters array for display
    const selectedFilters: string[] = [];
    
    if (localFilters.dealStage) selectedFilters.push(`Stage: ${localFilters.dealStage}`);
    if (localFilters.propertyType) selectedFilters.push(`Property: ${localFilters.propertyType}`);
    if (localFilters.priceRange.min || localFilters.priceRange.max) {
      const min = localFilters.priceRange.min || '0';
      const max = localFilters.priceRange.max || '∞';
      selectedFilters.push(`Price: $${min} - $${max}`);
    }
    if (localFilters.daysInStage) selectedFilters.push(`Days in Stage: ${localFilters.daysInStage}+`);
    if (localFilters.assignedAgent) selectedFilters.push(`Agent: ${localFilters.assignedAgent}`);
    if (localFilters.leadSource) selectedFilters.push(`Source: ${localFilters.leadSource}`);
    if (localFilters.dealProbability) selectedFilters.push(`Probability: ${localFilters.dealProbability}%+`);
    if (localFilters.lastActivity) selectedFilters.push(`Activity: ${localFilters.lastActivity}`);
    
    onApplyFilters(selectedFilters);
    onOpenChange(false);
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Deal Stage & Property Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Home className="h-4 w-4" />
                Deal & Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Deal Stage</Label>
                  <Select 
                    value={localFilters.dealStage} 
                    onValueChange={(value) => updateFilter('dealStage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="showing_scheduled">Showing Scheduled</SelectItem>
                      <SelectItem value="offer_made">Offer Made</SelectItem>
                      <SelectItem value="under_contract">Under Contract</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select 
                    value={localFilters.propertyType} 
                    onValueChange={(value) => updateFilter('propertyType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Family">Single Family</SelectItem>
                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                      <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={localFilters.priceRange.min}
                      onChange={(e) => updatePriceRange('min', e.target.value)}
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Maximum Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={localFilters.priceRange.max}
                      onChange={(e) => updatePriceRange('max', e.target.value)}
                      placeholder="No limit"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time & Performance Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time & Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Days in Current Stage</Label>
                  <Select 
                    value={localFilters.daysInStage} 
                    onValueChange={(value) => updateFilter('daysInStage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1+ days</SelectItem>
                      <SelectItem value="3">3+ days</SelectItem>
                      <SelectItem value="7">1+ week</SelectItem>
                      <SelectItem value="14">2+ weeks</SelectItem>
                      <SelectItem value="30">1+ month</SelectItem>
                      <SelectItem value="60">2+ months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Deal Probability</Label>
                  <Select 
                    value={localFilters.dealProbability} 
                    onValueChange={(value) => updateFilter('dealProbability', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any probability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%+ (Very High)</SelectItem>
                      <SelectItem value="75">75%+ (High)</SelectItem>
                      <SelectItem value="50">50%+ (Medium)</SelectItem>
                      <SelectItem value="25">25%+ (Low)</SelectItem>
                      <SelectItem value="10">10%+ (Very Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Last Activity</Label>
                  <Select 
                    value={localFilters.lastActivity} 
                    onValueChange={(value) => updateFilter('lastActivity', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="this_week">This week</SelectItem>
                      <SelectItem value="last_week">Last week</SelectItem>
                      <SelectItem value="this_month">This month</SelectItem>
                      <SelectItem value="over_month">Over a month ago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team & Source Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Team & Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned Agent</Label>
                  <Select 
                    value={localFilters.assignedAgent} 
                    onValueChange={(value) => updateFilter('assignedAgent', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah_johnson">Sarah Johnson</SelectItem>
                      <SelectItem value="mike_chen">Mike Chen</SelectItem>
                      <SelectItem value="lisa_williams">Lisa Williams</SelectItem>
                      <SelectItem value="david_brown">David Brown</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lead Source</Label>
                  <Select 
                    value={localFilters.leadSource} 
                    onValueChange={(value) => updateFilter('leadSource', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="zillow">Zillow</SelectItem>
                      <SelectItem value="realtor.com">Realtor.com</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="google">Google Ads</SelectItem>
                      <SelectItem value="open_house">Open House</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Summary */}
          {activeFiltersCount > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600">
            Apply Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white/20">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}