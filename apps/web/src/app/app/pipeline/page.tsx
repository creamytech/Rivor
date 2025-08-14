"use client";
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useMemo, useState } from "react";
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail, 
  Calendar, 
  DollarSign,
  User,
  Building,
  Phone,
  MapPin,
  Clock,
  Star,
  Archive
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Lead = { 
  id: string; 
  name: string; 
  company?: string;
  email?: string;
  phone?: string;
  value: string; 
  priority: "high" | "medium" | "low";
  source: string;
  lastActivity: string;
  assignedTo?: string;
  tags: string[];
};

type PipelineStage = {
  id: string;
  name: string;
  color: string;
  leads: Lead[];
};

const initialStages: PipelineStage[] = [
  {
    id: "new-lead",
    name: "New Lead",
    color: "#6366f1",
    leads: [
      { 
        id: "lead-1", 
        name: "John Smith", 
        company: "Smith Properties",
        email: "john@smith.com",
        phone: "+1 (555) 123-4567",
        value: "$750,000", 
        priority: "high",
        source: "Email",
        lastActivity: "2 hours ago",
        assignedTo: "You",
        tags: ["hot-lead", "residential"]
      },
      { 
        id: "lead-2", 
        name: "Sarah Johnson", 
        company: "Johnson Corp",
        email: "sarah@johnsoncorp.com",
        value: "$1,200,000", 
        priority: "medium",
        source: "Website",
        lastActivity: "1 day ago",
        tags: ["commercial"]
      }
    ]
  },
  {
    id: "qualified",
    name: "Qualified",
    color: "#8b5cf6",
    leads: [
      { 
        id: "lead-3", 
        name: "Mike Wilson", 
        company: "Wilson Industries",
        email: "mike@wilson.com",
        value: "$950,000", 
        priority: "high",
        source: "Referral",
        lastActivity: "3 hours ago",
        assignedTo: "Alice",
        tags: ["referral", "industrial"]
      }
    ]
  },
  {
    id: "proposal",
    name: "Proposal",
    color: "#06b6d4",
    leads: []
  },
  {
    id: "negotiation",
    name: "Negotiation", 
    color: "#f59e0b",
    leads: []
  },
  {
    id: "closed-won",
    name: "Closed Won",
    color: "#10b981",
    leads: []
  },
  {
    id: "closed-lost",
    name: "Closed Lost",
    color: "#ef4444",
    leads: []
  }
];

// Sortable Lead Card Component
function SortableLeadCard({ lead, stageId }: { lead: Lead; stageId: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100", 
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg cursor-grab hover:shadow-md transition-all ${
        isDragging ? "shadow-lg opacity-50" : ""
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{lead.name}</h4>
            {lead.company && (
              <p className="text-xs text-[var(--muted-foreground)]">{lead.company}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-3 w-3 text-green-600" />
          <span className="text-sm font-medium">{lead.value}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>{lead.lastActivity}</span>
          <Badge variant="secondary" className={`text-xs ${priorityColors[lead.priority]}`}>
            {lead.priority}
          </Badge>
        </div>

        {lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {lead.assignedTo && (
          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <User className="h-3 w-3" />
            <span>{lead.assignedTo}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Pipeline Stage Column Component
function PipelineStageColumn({ stage }: { stage: PipelineStage }) {
  return (
    <Card className="w-80 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: stage.color }}
            />
            <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {stage.leads.length}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <SortableContext items={stage.leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[200px]">
            {stage.leads.length === 0 ? (
              <div className="text-center text-sm text-[var(--muted-foreground)] py-8">
                Drop leads here or click + to add
              </div>
            ) : (
              stage.leads.map((lead) => (
                <SortableLeadCard key={lead.id} lead={lead} stageId={stage.id} />
              ))
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active lead and its current stage
    let activeStageIndex = -1;
    let activeLeadIndex = -1;
    let activeLead: Lead | null = null;

    for (let i = 0; i < stages.length; i++) {
      const leadIndex = stages[i].leads.findIndex(lead => lead.id === activeId);
      if (leadIndex !== -1) {
        activeStageIndex = i;
        activeLeadIndex = leadIndex;
        activeLead = stages[i].leads[leadIndex];
        break;
      }
    }

    if (!activeLead) return;

    // Determine target stage
    let targetStageIndex = -1;
    
    // Check if dropping on a stage (stage ID)
    const stageIndex = stages.findIndex(stage => stage.id === overId);
    if (stageIndex !== -1) {
      targetStageIndex = stageIndex;
    } else {
      // Check if dropping on another lead
      for (let i = 0; i < stages.length; i++) {
        if (stages[i].leads.some(lead => lead.id === overId)) {
          targetStageIndex = i;
          break;
        }
      }
    }

    if (targetStageIndex === -1) return;

    // Move the lead
    setStages(prevStages => {
      const newStages = [...prevStages];
      
      // Remove from current stage
      newStages[activeStageIndex] = {
        ...newStages[activeStageIndex],
        leads: newStages[activeStageIndex].leads.filter(lead => lead.id !== activeId)
      };
      
      // Add to target stage
      newStages[targetStageIndex] = {
        ...newStages[targetStageIndex],
        leads: [...newStages[targetStageIndex].leads, activeLead]
      };
      
      return newStages;
    });
  };

  const activeLead = activeId ? stages.flatMap(s => s.leads).find(l => l.id === activeId) : null;

  const rightDrawer = selectedLead ? (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Lead Details</h3>
        <Button variant="ghost" size="icon" onClick={() => setSelectedLead(null)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-medium">{selectedLead.name}</h4>
          {selectedLead.company && (
            <p className="text-sm text-[var(--muted-foreground)]">{selectedLead.company}</p>
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          {selectedLead.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{selectedLead.email}</span>
            </div>
          )}
          {selectedLead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{selectedLead.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium">{selectedLead.value}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Source:</span> {selectedLead.source}
          </div>
          <div className="text-sm">
            <span className="font-medium">Last Activity:</span> {selectedLead.lastActivity}
          </div>
          {selectedLead.assignedTo && (
            <div className="text-sm">
              <span className="font-medium">Assigned to:</span> {selectedLead.assignedTo}
            </div>
          )}
        </div>

        {selectedLead.tags.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Tags</div>
            <div className="flex flex-wrap gap-1">
              {selectedLead.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full">
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          <Edit className="h-4 w-4 mr-2" />
          Edit Lead
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <AppShell rightDrawer={rightDrawer}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Sales Pipeline</h1>
            <p className="text-[var(--muted-foreground)]">
              Track and manage your deals through each stage
            </p>
          </div>
          <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
            <DialogTrigger asChild>
              <Button variant="brand">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input placeholder="Lead name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company</label>
                    <Input placeholder="Company name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input placeholder="+1 (555) 123-4567" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deal Value</label>
                    <Input placeholder="$100,000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowNewLeadDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="brand" onClick={() => setShowNewLeadDialog(false)}>
                    Create Lead
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-6">
            {stages.map((stage) => (
              <PipelineStageColumn key={stage.id} stage={stage} />
            ))}
          </div>
          
          <DragOverlay>
            {activeLead ? (
              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg rotate-3">
                <div className="font-medium text-sm">{activeLead.name}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{activeLead.value}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppShell>
  );
}


