"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Home,
  Mail,
  MoreHorizontal,
  Phone,
  Star,
  TrendingUp,
  User,
  Users,
  Zap,
  Target,
  Activity,
  FileText,
  Eye,
  MessageSquare
} from 'lucide-react';

export interface PipelineLead {
  id: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  stage: 'prospect' | 'qualified' | 'needs_analysis' | 'property_tour' | 'negotiation' | 'under_contract' | 'closed' | 'lost';
  leadType: 'buyer' | 'seller' | 'investor' | 'renter';
  value: number;
  probability: number;
  propertyOfInterest?: {
    address: string;
    type: string;
    price: number;
  };
  source: 'email' | 'website' | 'referral' | 'cold_call' | 'social_media';
  assignedAgent: string;
  nextAction: {
    type: 'call' | 'email' | 'meeting' | 'showing' | 'follow_up';
    description: string;
    dueDate: Date;
  };
  interactions: {
    emails: number;
    calls: number;
    meetings: number;
    showings: number;
    lastContact: Date;
  };
  timeline: {
    date: Date;
    action: string;
    note?: string;
  }[];
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PipelineIntegrationProps {
  emailData?: {
    from: string;
    subject: string;
    content: string;
  };
  onLeadCreate?: (lead: PipelineLead) => void;
  onLeadUpdate?: (leadId: string, updates: Partial<PipelineLead>) => void;
}

const PIPELINE_STAGES = [
  { key: 'prospect', label: 'Prospect', color: 'bg-gray-100 text-gray-800', icon: User },
  { key: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  { key: 'needs_analysis', label: 'Needs Analysis', color: 'bg-yellow-100 text-yellow-800', icon: FileText },
  { key: 'property_tour', label: 'Property Tour', color: 'bg-purple-100 text-purple-800', icon: Eye },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-800', icon: MessageSquare },
  { key: 'under_contract', label: 'Under Contract', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { key: 'closed', label: 'Closed', color: 'bg-emerald-100 text-emerald-800', icon: Target },
  { key: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
] as const;

// Mock pipeline data generator
const generateMockPipelineLeads = (): PipelineLead[] => {
  const names = [
    'Jennifer Martinez', 'Alex Thompson', 'Rachel Green', 'Mark Johnson',
    'Lisa Chen', 'David Rodriguez', 'Sarah Wilson', 'Michael Brown'
  ];
  
  const agents = ['John Smith', 'Mary Johnson', 'Tom Wilson', 'Lisa Davis'];
  const leadTypes: PipelineLead['leadType'][] = ['buyer', 'seller', 'investor', 'renter'];
  const stages = PIPELINE_STAGES.map(s => s.key);
  
  return names.map((name, index) => {
    const stage = stages[index % stages.length] as PipelineLead['stage'];
    const leadType = leadTypes[index % leadTypes.length];
    const baseValue = leadType === 'buyer' ? 450000 : leadType === 'seller' ? 520000 : 380000;
    
    return {
      id: `lead-${index + 1}`,
      contactName: name,
      contactEmail: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      phone: `(555) ${String(index + 200).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      stage,
      leadType,
      value: baseValue + (Math.random() * 200000),
      probability: Math.floor(Math.random() * 100),
      propertyOfInterest: {
        address: `${index + 100} ${['Oak St', 'Pine Ave', 'Maple Dr', 'Cedar Ln'][index % 4]}`,
        type: ['Condo', 'Single Family', 'Townhouse', 'Investment'][index % 4],
        price: baseValue + (Math.random() * 150000)
      },
      source: ['email', 'website', 'referral', 'cold_call'][index % 4] as PipelineLead['source'],
      assignedAgent: agents[index % agents.length],
      nextAction: {
        type: ['call', 'email', 'meeting', 'showing'][index % 4] as PipelineLead['nextAction']['type'],
        description: `Follow up on ${['pricing questions', 'property tour', 'financing options', 'market analysis'][index % 4]}`,
        dueDate: new Date(Date.now() + ((index + 1) * 24 * 60 * 60 * 1000))
      },
      interactions: {
        emails: Math.floor(Math.random() * 15) + 1,
        calls: Math.floor(Math.random() * 8),
        meetings: Math.floor(Math.random() * 4),
        showings: Math.floor(Math.random() * 3),
        lastContact: new Date(Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000))
      },
      timeline: [
        { date: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)), action: 'Lead created from email inquiry' },
        { date: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)), action: 'Initial qualification call completed' },
        { date: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)), action: 'Property preferences updated' }
      ],
      tags: [
        index % 3 === 0 ? 'Hot Lead' : '',
        index % 4 === 0 ? 'Referral' : '',
        index % 5 === 0 ? 'First Time' : ''
      ].filter(Boolean),
      notes: `Lead generated from ${['website inquiry', 'email response', 'referral contact', 'social media'][index % 4]}. ${index % 2 === 0 ? 'Highly motivated buyer.' : 'Needs timeline flexibility.'}`,
      createdAt: new Date(Date.now() - ((index + 1) * 7 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date(Date.now() - (Math.random() * 24 * 60 * 60 * 1000))
    };
  });
};

export default function PipelineIntegration({ emailData, onLeadCreate, onLeadUpdate }: PipelineIntegrationProps) {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  useEffect(() => {
    setLeads(generateMockPipelineLeads());
  }, []);

  const getStageConfig = (stage: PipelineLead['stage']) => {
    return PIPELINE_STAGES.find(s => s.key === stage) || PIPELINE_STAGES[0];
  };

  const getLeadTypeColor = (type: PipelineLead['leadType']) => {
    const colors = {
      buyer: 'bg-blue-100 text-blue-800',
      seller: 'bg-green-100 text-green-800',
      investor: 'bg-purple-100 text-purple-800',
      renter: 'bg-orange-100 text-orange-800'
    };
    return colors[type];
  };

  const moveLeadToStage = (leadId: string, newStage: PipelineLead['stage']) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const updatedLead = {
          ...lead,
          stage: newStage,
          updatedAt: new Date(),
          timeline: [
            ...lead.timeline,
            {
              date: new Date(),
              action: `Moved to ${getStageConfig(newStage).label} stage`
            }
          ]
        };
        onLeadUpdate?.(leadId, updatedLead);
        return updatedLead;
      }
      return lead;
    }));
  };

  const getStageLeads = (stage: PipelineLead['stage']) => {
    return leads.filter(lead => {
      const matchesStage = lead.stage === stage;
      const matchesAgent = agentFilter === 'all' || lead.assignedAgent === agentFilter;
      return matchesStage && matchesAgent;
    });
  };

  const calculateStageValue = (stage: PipelineLead['stage']) => {
    return getStageLeads(stage).reduce((sum, lead) => sum + (lead.value * lead.probability / 100), 0);
  };

  const allAgents = Array.from(new Set(leads.map(lead => lead.assignedAgent)));

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLead(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineLead['stage']) => {
    e.preventDefault();
    if (draggedLead) {
      moveLeadToStage(draggedLead, targetStage);
      setDraggedLead(null);
    }
  };

  const createLeadFromEmail = () => {
    if (!emailData) return;

    const newLead: PipelineLead = {
      id: `lead-${Date.now()}`,
      contactName: emailData.from.split('@')[0].replace(/[._]/g, ' '),
      contactEmail: emailData.from,
      stage: 'prospect',
      leadType: 'buyer', // Default assumption
      value: 450000, // Default property value
      probability: 25, // Low initial probability
      source: 'email',
      assignedAgent: allAgents[0] || 'Unassigned',
      nextAction: {
        type: 'email',
        description: 'Send initial response and qualification questions',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      interactions: {
        emails: 1,
        calls: 0,
        meetings: 0,
        showings: 0,
        lastContact: new Date()
      },
      timeline: [
        {
          date: new Date(),
          action: 'Lead created from email inquiry',
          note: `Subject: ${emailData.subject}`
        }
      ],
      tags: ['Email Lead', 'New'],
      notes: `Auto-created from email: ${emailData.subject}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setLeads(prev => [newLead, ...prev]);
    onLeadCreate?.(newLead);
    return newLead;
  };

  // Pipeline metrics
  const totalPipelineValue = leads.reduce((sum, lead) => sum + (lead.value * lead.probability / 100), 0);
  const averageDealSize = leads.length > 0 ? leads.reduce((sum, lead) => sum + lead.value, 0) / leads.length : 0;
  const conversionRate = leads.length > 0 ? (leads.filter(l => l.stage === 'closed').length / leads.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Pipeline Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Pipeline Value</p>
                <p className="text-2xl font-bold text-blue-800">
                  ${totalPipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Active Leads</p>
                <p className="text-2xl font-bold text-green-800">{leads.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Avg Deal Size</p>
                <p className="text-2xl font-bold text-purple-800">
                  ${averageDealSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-800">{conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Agents</option>
            {allAgents.map(agent => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>

          {emailData && (
            <Button onClick={createLeadFromEmail} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Create Lead from Email
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="grid grid-cols-4 gap-4 h-[600px]">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = getStageLeads(stage.key as PipelineLead['stage']);
          const stageValue = calculateStageValue(stage.key as PipelineLead['stage']);
          const StageIcon = stage.icon;

          return (
            <div
              key={stage.key}
              className="bg-gray-50 rounded-lg p-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key as PipelineLead['stage'])}
            >
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <StageIcon className="h-4 w-4" />
                  <h3 className="font-medium text-sm">{stage.label}</h3>
                  <Badge variant="outline" className="text-xs">
                    {stageLeads.length}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  ${stageValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} weighted
                </p>
              </div>

              <div className="space-y-2 overflow-y-auto h-[500px]">
                <AnimatePresence>
                  {stageLeads.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="bg-white rounded-lg p-3 border hover:shadow-md transition-shadow cursor-move"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{lead.contactName}</h4>
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
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Phone className="h-4 w-4 mr-2" />
                                Schedule Call
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calendar className="h-4 w-4 mr-2" />
                                Book Showing
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-1">
                          <Badge className={getLeadTypeColor(lead.leadType)} variant="outline">
                            {lead.leadType}
                          </Badge>
                          <div className="text-xs text-gray-600 ml-auto">
                            {lead.probability}% • ${(lead.value / 1000).toFixed(0)}K
                          </div>
                        </div>

                        {lead.propertyOfInterest && (
                          <div className="text-xs text-gray-600">
                            <Home className="h-3 w-3 inline mr-1" />
                            {lead.propertyOfInterest.address}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{lead.assignedAgent}</span>
                          <span>{lead.interactions.lastContact.toLocaleDateString()}</span>
                        </div>

                        {lead.nextAction && (
                          <div className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due {lead.nextAction.dueDate.toLocaleDateString()}
                            </div>
                            <div className="mt-1">{lead.nextAction.description}</div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedLead && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedLead.contactName}</DialogTitle>
                    <DialogDescription>{selectedLead.contactEmail}</DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getLeadTypeColor(selectedLead.leadType)}>
                      {selectedLead.leadType}
                    </Badge>
                    <Badge className={getStageConfig(selectedLead.stage).color}>
                      {getStageConfig(selectedLead.stage).label}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Lead Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${selectedLead.value.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">
                      {selectedLead.probability}% probability
                    </div>
                    <Progress value={selectedLead.probability} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Interactions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Emails:</span>
                      <span>{selectedLead.interactions.emails}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Calls:</span>
                      <span>{selectedLead.interactions.calls}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Meetings:</span>
                      <span>{selectedLead.interactions.meetings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Showings:</span>
                      <span>{selectedLead.interactions.showings}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Next Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">{selectedLead.nextAction.type}</div>
                    <div className="text-sm text-gray-600">{selectedLead.nextAction.description}</div>
                    <div className="text-xs text-orange-600 mt-2">
                      Due: {selectedLead.nextAction.dueDate.toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedLead.propertyOfInterest && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Property of Interest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium">Address</div>
                        <div className="text-sm text-gray-600">{selectedLead.propertyOfInterest.address}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Type</div>
                        <div className="text-sm text-gray-600">{selectedLead.propertyOfInterest.type}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Price</div>
                        <div className="text-sm text-gray-600">${selectedLead.propertyOfInterest.price.toLocaleString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedLead.timeline.map((event, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <div className="text-sm font-medium">{event.action}</div>
                          <div className="text-xs text-gray-600">{event.date.toLocaleDateString()}</div>
                          {event.note && (
                            <div className="text-xs text-gray-500 mt-1">{event.note}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}