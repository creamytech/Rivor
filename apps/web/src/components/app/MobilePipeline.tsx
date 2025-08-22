"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Plus,
  DollarSign,
  Calendar,
  User,
  MoreVertical,
  TrendingUp,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface MobilePipelineProps {
  className?: string;
}

interface Deal {
  id: string;
  title: string;
  client: string;
  value: number;
  stage: string;
  lastActivity: string;
  priority: 'high' | 'medium' | 'low';
  probability: number;
  closeDate: string;
  description: string;
}

interface Stage {
  id: string;
  name: string;
  deals: Deal[];
  color: string;
}

export default function MobilePipeline({ className }: MobilePipelineProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading pipeline data
    const loadPipeline = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setStages([
        {
          id: '1',
          name: 'New Leads',
          color: 'blue',
          deals: [
            {
              id: '1',
              title: 'Downtown Investment Property',
              client: 'Sarah Johnson',
              value: 250000,
              stage: 'New Leads',
              lastActivity: '2 hours ago',
              priority: 'high',
              probability: 75,
              closeDate: '2024-02-15',
              description: 'Interested in downtown commercial property for investment purposes'
            },
            {
              id: '2',
              title: 'Family Home Purchase',
              client: 'Michael Chen',
              value: 450000,
              stage: 'New Leads',
              lastActivity: '1 day ago',
              priority: 'medium',
              probability: 60,
              closeDate: '2024-02-20',
              description: 'Looking for 3-bedroom family home in suburbs'
            }
          ]
        },
        {
          id: '2',
          name: 'Qualified',
          color: 'yellow',
          deals: [
            {
              id: '3',
              title: 'Luxury Condo Sale',
              client: 'Emma Rodriguez',
              value: 680000,
              stage: 'Qualified',
              lastActivity: '3 hours ago',
              priority: 'high',
              probability: 85,
              closeDate: '2024-02-10',
              description: 'Pre-approved buyer looking for luxury downtown condo'
            }
          ]
        },
        {
          id: '3',
          name: 'Proposal',
          color: 'orange',
          deals: [
            {
              id: '4',
              title: 'Commercial Office Space',
              client: 'David Kim',
              value: 1200000,
              stage: 'Proposal',
              lastActivity: '5 hours ago',
              priority: 'high',
              probability: 90,
              closeDate: '2024-02-05',
              description: 'Corporate client needs office space for expanding team'
            }
          ]
        },
        {
          id: '4',
          name: 'Negotiation',
          color: 'purple',
          deals: [
            {
              id: '5',
              title: 'Retail Space Lease',
              client: 'Lisa Wang',
              value: 180000,
              stage: 'Negotiation',
              lastActivity: '1 day ago',
              priority: 'medium',
              probability: 70,
              closeDate: '2024-02-12',
              description: 'Small business owner looking for retail space'
            }
          ]
        },
        {
          id: '5',
          name: 'Closed Won',
          color: 'green',
          deals: [
            {
              id: '6',
              title: 'Warehouse Purchase',
              client: 'Robert Smith',
              value: 850000,
              stage: 'Closed Won',
              lastActivity: '2 days ago',
              priority: 'low',
              probability: 100,
              closeDate: '2024-01-30',
              description: 'Successfully closed warehouse deal for logistics company'
            }
          ]
        }
      ]);
      
      setLoading(false);
    };

    loadPipeline();
  }, []);

  const currentStage = stages[currentStageIndex];
  const filteredDeals = currentStage?.deals.filter(deal =>
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.client.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSwipeStage = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentStageIndex > 0) {
      setCurrentStageIndex(currentStageIndex - 1);
    } else if (direction === 'right' && currentStageIndex < stages.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStageColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'yellow': return 'bg-yellow-500';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`p-4 space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (selectedDeal) {
    return (
      <motion.div 
        className={`h-full flex flex-col ${className}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Deal Header */}
        <div 
          className="p-4 border-b"
          style={{
            backgroundColor: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDeal(null)}
              className="glass-button"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h2 className="font-semibold text-lg" style={{ color: 'var(--glass-text)' }}>
                {selectedDeal.title}
              </h2>
              <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                {selectedDeal.client} • ${selectedDeal.value.toLocaleString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="glass-button"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 glass-button">
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button size="sm" className="flex-1 glass-button">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" className="glass-button">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Deal Details */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Overview */}
          <div 
            className="p-4 rounded-xl space-y-3"
            style={{
              backgroundColor: 'var(--glass-surface)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <h3 className="font-semibold" style={{ color: 'var(--glass-text)' }}>Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--glass-text-muted)' }}>VALUE</p>
                <p className="text-lg font-bold" style={{ color: 'var(--glass-text)' }}>
                  ${selectedDeal.value.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--glass-text-muted)' }}>PROBABILITY</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${selectedDeal.probability}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                    {selectedDeal.probability}%
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--glass-text-muted)' }}>CLOSE DATE</p>
                <p className="text-sm" style={{ color: 'var(--glass-text)' }}>{selectedDeal.closeDate}</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--glass-text-muted)' }}>PRIORITY</p>
                <Badge className={`text-xs ${getPriorityColor(selectedDeal.priority)}`}>
                  {selectedDeal.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          <div 
            className="p-4 rounded-xl"
            style={{
              backgroundColor: 'var(--glass-surface)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--glass-text)' }}>Description</h3>
            <p className="text-sm" style={{ color: 'var(--glass-text)' }}>
              {selectedDeal.description}
            </p>
          </div>

          {/* Activities */}
          <div 
            className="p-4 rounded-xl"
            style={{
              backgroundColor: 'var(--glass-surface)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <h3 className="font-semibold mb-3" style={{ color: 'var(--glass-text)' }}>Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--glass-text)' }}>
                    Email sent to {selectedDeal.client}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                    {selectedDeal.lastActivity}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--glass-text)' }}>
                    Call scheduled for tomorrow
                  </p>
                  <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                    Yesterday
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`p-4 space-y-4 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onTouchStart={(e) => {
        const startX = e.touches[0].clientX;
        const handleTouchEnd = (endEvent: TouchEvent) => {
          const endX = endEvent.changedTouches[0].clientX;
          const deltaX = endX - startX;
          
          if (Math.abs(deltaX) > 100) {
            if (deltaX > 0) {
              handleSwipeStage('left');
            } else {
              handleSwipeStage('right');
            }
          }
          
          document.removeEventListener('touchend', handleTouchEnd);
        };
        
        document.addEventListener('touchend', handleTouchEnd);
      }}
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: 'var(--glass-text)' }}>
            Pipeline
          </h1>
          <Button 
            size="sm"
            style={{
              backgroundColor: 'var(--glass-primary)',
              color: 'var(--glass-primary-foreground)'
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--glass-text-muted)' }} />
          <Input
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            style={{
              backgroundColor: 'var(--glass-surface)',
              border: '1px solid var(--glass-border)',
              color: 'var(--glass-text)'
            }}
          />
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => (
          <Button
            key={stage.id}
            variant={index === currentStageIndex ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentStageIndex(index)}
            className={`flex-shrink-0 ${index === currentStageIndex ? getStageColor(stage.color) : ''}`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${getStageColor(stage.color)}`} />
            {stage.name} ({stage.deals.length})
          </Button>
        ))}
      </div>

      {/* Stage Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSwipeStage('left')}
          disabled={currentStageIndex === 0}
          className="glass-button"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>
        
        <div className="text-center">
          <h2 className="font-semibold" style={{ color: 'var(--glass-text)' }}>
            {currentStage?.name}
          </h2>
          <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
            {currentStageIndex + 1} of {stages.length} stages
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSwipeStage('right')}
          disabled={currentStageIndex === stages.length - 1}
          className="glass-button"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Deals List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredDeals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedDeal(deal)}
              className="p-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--glass-surface)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--glass-text)' }}>
                    {deal.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                    {deal.client}
                  </p>
                </div>
                <Badge className={`text-xs ${getPriorityColor(deal.priority)}`}>
                  {deal.priority}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--glass-text-muted)' }} />
                  <span className="font-semibold" style={{ color: 'var(--glass-text)' }}>
                    ${deal.value.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">
                    {deal.probability}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                <span>Last activity: {deal.lastActivity}</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{deal.closeDate}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDeals.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--glass-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
            {searchQuery ? 'No deals found' : 'No deals in this stage'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}