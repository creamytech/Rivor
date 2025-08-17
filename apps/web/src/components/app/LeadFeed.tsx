"use client";
import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  ArrowUp, 
  Calendar, 
  MoreHorizontal, 
  User, 
  Building, 
  Home,
  Clock,
  Star,
  Eye
} from 'lucide-react';

interface LeadItem {
  id: string;
  subject: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
  };
  intent: 'buyer' | 'seller' | 'renter' | 'other';
  confidence: number;
  lastReplyTime: string;
  stage: 'new' | 'qualified' | 'meeting' | 'closed';
  hasAttachment: boolean;
  isUnread: boolean;
}

interface LeadFeedProps {
  leads?: LeadItem[];
  reviewItems?: LeadItem[];
}

export default function LeadFeed({ 
  leads = [], 
  reviewItems = [] 
}: LeadFeedProps) {
  const [activeTab, setActiveTab] = useState('leads');

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'buyer':
        return <Home className="h-3 w-3" />;
      case 'seller':
        return <Building className="h-3 w-3" />;
      case 'renter':
        return <User className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'buyer':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'seller':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'renter':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'qualified':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'meeting':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'closed':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const renderLeadItem = (item: LeadItem) => (
    <div 
      key={item.id}
      className={`p-4 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer ${
        item.isUnread ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarImage src={item.sender.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {item.sender.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-sm truncate ${item.isUnread ? 'font-semibold' : ''}`}>
                {item.subject}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {item.sender.name} • {item.sender.email}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {item.lastReplyTime}
            </div>
          </div>

          {/* Chips */}
          <div className="flex items-center gap-2 mb-3">
            <Badge 
              variant="secondary" 
              className={`text-xs ${getIntentColor(item.intent)}`}
            >
              {getIntentIcon(item.intent)}
              <span className="ml-1 capitalize">{item.intent}</span>
            </Badge>
            
            <Badge 
              variant="outline" 
              className={`text-xs ${getConfidenceColor(item.confidence)}`}
            >
              {item.confidence}% confidence
            </Badge>

            <Badge 
              variant="secondary" 
              className={`text-xs ${getStageColor(item.stage)}`}
            >
              {item.stage}
            </Badge>

            {item.hasAttachment && (
              <Badge variant="outline" className="text-xs">
                📎
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                // Handle reply
              }}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Reply
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                // Handle promote
              }}
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Promote
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                // Handle schedule
              }}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Schedule
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                // Handle more actions
              }}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <GlassCard variant="gradient" intensity="medium" className="h-full">
      <GlassCardHeader className="pb-3">
        <GlassCardTitle className="text-lg">Lead Feed</GlassCardTitle>
      </GlassCardHeader>
      
      <GlassCardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="leads" className="text-sm">
              Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="review" className="text-sm">
              Review ({reviewItems.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="mt-0">
            <div className="max-h-96 overflow-y-auto">
              {leads.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-2">No leads yet</p>
                  <p className="text-xs text-slate-500">
                    New leads will appear here as they come in
                  </p>
                </div>
              ) : (
                leads.map(renderLeadItem)
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="review" className="mt-0">
            <div className="max-h-96 overflow-y-auto">
              {reviewItems.length === 0 ? (
                <div className="p-8 text-center">
                  <Eye className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-2">No items to review</p>
                  <p className="text-xs text-slate-500">
                    Items needing review will appear here
                  </p>
                </div>
              ) : (
                reviewItems.map(renderLeadItem)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </GlassCardContent>
    </GlassCard>
  );
}
