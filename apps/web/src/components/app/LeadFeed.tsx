"use client";
import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquare, ArrowUp, Calendar, MoreHorizontal, User, Building, Home, Clock, Star, Eye, Plus, TrendingUp, Filter } from 'lucide-react';

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
  } | null;
  tasks?: Array<{
    id: string;
    title: string;
    dueAt: string | null;
    done: boolean;
  }>;
}

interface LeadFeedProps {
  leads: Lead[];
  reviewItems?: any[];
  crmSyncStatus?: string;
}

export default function LeadFeed({ leads = [], reviewItems = [], crmSyncStatus }: LeadFeedProps) {
  const [activeTab, setActiveTab] = useState('leads');
  const [syncStatus, setSyncStatus] = useState(crmSyncStatus || 'idle');

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/crm/status');
        if (res.ok) {
          const data = await res.json();
          setSyncStatus(data.status);
        }
      } catch (err) {
        console.warn('Failed to fetch CRM sync status', err);
      }
    }
    fetchStatus();
    const id = setInterval(fetchStatus, 60000);
    return () => clearInterval(id);
  }, []);

  const getIntentFromTitle = (title: string | null): 'buyer' | 'seller' | 'renter' => {
    if (!title) return 'buyer';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('sell') || lowerTitle.includes('listing')) return 'seller';
    if (lowerTitle.includes('rent') || lowerTitle.includes('lease')) return 'renter';
    return 'buyer';
  };

  const getConfidenceFromProbability = (probability: number | null): number => {
    return probability || 50;
  };

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

  const renderLeadItem = (lead: Lead) => {
    const intent = getIntentFromTitle(lead.title);
    const confidence = getConfidenceFromProbability(lead.probabilityPercent);
    const timeAgo = getTimeAgo(lead.updatedAt);
    const contactName = lead.contact?.nameEnc ? 'Contact Name' : 'Unknown Contact';
    const companyName = lead.contact?.companyEnc ? 'Company Name' : '';

    return (
      <div
        key={lead.id}
        className={`p-4 border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer ${
          lead.status === 'active' ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {contactName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {lead.title || 'Untitled Lead'}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {contactName} {companyName && `• ${companyName}`}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge 
                  variant={lead.priority === 'high' ? 'destructive' : lead.priority === 'medium' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {lead.priority}
                </Badge>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant={intent === 'buyer' ? 'default' : intent === 'seller' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {intent}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {confidence}% confidence
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
              {lead.assignedTo && (
                <Badge variant="outline" className="text-xs">
                  {lead.assignedTo.user.name || lead.assignedTo.user.email}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </div>
                {lead.source && (
                  <div className="text-xs text-slate-500">
                    via {lead.source}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Promote
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <GlassCard variant="river-flow" intensity="medium" flowDirection="down" className="h-full">
      <GlassCardHeader className="pb-3 flex items-center justify-between">
        <GlassCardTitle className="text-lg">Lead Feed</GlassCardTitle>
        <Badge variant={syncStatus === 'syncing' ? 'secondary' : 'outline'} className="text-xs">
          {syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'error' ? 'Sync Error' : 'Synced'}
        </Badge>
      </GlassCardHeader>
      <GlassCardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="leads" className="text-sm">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="review" className="text-sm">Review ({reviewItems.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="mt-0">
            {leads.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-6 w-6" />}
                title="No leads yet"
                description="Leads will appear here as they're detected from your email stream. We'll automatically identify potential customers and opportunities."
                illustration="flow"
                size="lg"
                actions={[
                  {
                    label: "Add Lead Manually",
                    onClick: () => window.location.href = '/pipeline/create',
                    variant: 'default',
                    icon: <Plus className="h-4 w-4" />
                  },
                  {
                    label: "View Email Stream",
                    onClick: () => window.location.href = '/app/inbox',
                    variant: 'outline',
                    icon: <MessageSquare className="h-4 w-4" />
                  }
                ]}
              />
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {leads.map(renderLeadItem)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="review" className="mt-0">
            {reviewItems.length === 0 ? (
              <EmptyState
                icon={<Filter className="h-6 w-6" />}
                title="No items for review"
                description="Items that need your attention will appear here. This includes leads that need qualification, follow-ups, or manual review."
                illustration="bubbles"
                size="lg"
                actions={[
                  {
                    label: "Check Email Stream",
                    onClick: () => window.location.href = '/app/inbox',
                    variant: 'default',
                    icon: <MessageSquare className="h-4 w-4" />
                  },
                  {
                    label: "View All Leads",
                    onClick: () => setActiveTab('leads'),
                    variant: 'outline',
                    icon: <TrendingUp className="h-4 w-4" />
                  }
                ]}
              />
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {reviewItems.map((item) => (
                  <div key={item.id} className="p-4 border-b border-white/20 last:border-b-0">
                    {/* Review item content */}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </GlassCardContent>
    </GlassCard>
  );
}
