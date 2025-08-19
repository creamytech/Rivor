"use client";
import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import FlowCard from '@/components/river/FlowCard';
import PipelineColumn from './PipelineColumn';
import PipelineCard from './PipelineCard';
import CreateLeadModal from './CreateLeadModal';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { useToast } from '@/components/river/RiverToast';

export interface Lead {
  id: string;
  title: string;
  company: string;
  contact: string;
  email?: string;
  value: number;
  probability: number;
  stage: string;
  priority: 'low' | 'medium' | 'high';
  source: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  automationEnabled: boolean;
  activities?: Activity[];
  tags: string[];
  threadId?: string; // Link to email thread
}

export interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  description: string;
  createdAt: string;
  linkedEmailId?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  leads: Lead[];
  recentActivity?: boolean;
}

interface PipelineBoardProps {
  className?: string;
}

export default function PipelineBoard({ className }: PipelineBoardProps) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pipeline/stages');
      if (response.ok) {
        const data = await response.json();
        setStages(data.stages || []);
      }
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the lead being dragged
    const activeLead = stages
      .flatMap(stage => stage.leads)
      .find(lead => lead.id === activeId);

    if (!activeLead) return;

    // Find the target stage
    const targetStage = stages.find(stage => 
      stage.id === overId || stage.leads.some(lead => lead.id === overId)
    );

    if (!targetStage) return;

    // If dropping on the same stage, do nothing
    if (activeLead.stage === targetStage.id) return;

    // Optimistic update
    setStages(prevStages => {
      const newStages = prevStages.map(stage => ({
        ...stage,
        leads: stage.leads.filter(lead => lead.id !== activeId)
      }));

      const targetStageIndex = newStages.findIndex(s => s.id === targetStage.id);
      if (targetStageIndex !== -1) {
        newStages[targetStageIndex] = {
          ...newStages[targetStageIndex],
          leads: [
            ...newStages[targetStageIndex].leads,
            { ...activeLead, stage: targetStage.id }
          ]
        };
      }

      return newStages;
    });

    // Persist the change
    try {
      const response = await fetch(`/api/pipeline/leads/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage.id })
      });

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Lead Moved',
          description: `"${activeLead.title}" moved to ${targetStage.name}`
        });
      } else {
        // Revert on error
        fetchPipelineData();
        addToast({
          type: 'error',
          title: 'Failed to Move Lead',
          description: 'Please try again'
        });
      }
    } catch (error) {
      // Revert on error
      fetchPipelineData();
      addToast({
        type: 'error',
        title: 'Failed to Move Lead',
        description: 'Please try again'
      });
    }
  };

  const handleCreateLead = (stageId?: string) => {
    setSelectedStage(stageId || null);
    setShowCreateModal(true);
  };

  const handleLeadCreated = (lead: Lead) => {
    setStages(prev => prev.map(stage => 
      stage.id === lead.stage 
        ? { ...stage, leads: [...stage.leads, lead] }
        : stage
    ));
    
    addToast({
      type: 'success',
      title: 'Lead Created',
      description: `"${lead.title}" has been added to your pipeline`
    });
  };

  const activeLead = activeId 
    ? stages.flatMap(s => s.leads).find(l => l.id === activeId)
    : null;

  if (loading) {
    return (
      <FlowCard className={className}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FlowCard>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <FlowCard className={className}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Sales Pipeline
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your leads and track deals through the sales process
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button 
                onClick={() => handleCreateLead()}
                className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </div>
          </div>

          {/* Pipeline Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
            {stages.map((stage) => (
              <SortableContext
                key={stage.id}
                items={stage.leads.map(lead => lead.id)}
                strategy={verticalListSortingStrategy}
              >
                <PipelineColumn
                  stage={stage}
                  onCreateLead={() => handleCreateLead(stage.id)}
                />
              </SortableContext>
            ))}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeLead ? (
            <PipelineCard lead={activeLead} isDragging />
          ) : null}
        </DragOverlay>
      </FlowCard>

      <CreateLeadModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        defaultStage={selectedStage}
        onLeadCreated={handleLeadCreated}
      />
    </DndContext>
  );
}
