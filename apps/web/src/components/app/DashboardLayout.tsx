"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import type { KeyboardCoordinateGetter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Save,
  RotateCcw,
  Plus,
  Eye,
  EyeOff,
  Grid3X3,
  Lock,
  Unlock,
  GripVertical
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import DashboardCard from './DashboardCard';

// Import dashboard cards
import TodayAtAGlance from './TodayAtAGlance';
import CompactSyncProgress from './CompactSyncProgress';
import LeadFeed from './LeadFeed';
import ActivityFeed from './ActivityFeed';
import HealthWidget from './HealthWidget';
import MiniPipelineSparkline from './MiniPipelineSparkline';
import PropertySearchWidget from './PropertySearchWidget';

// Import drawer components
import CardManagementDrawer from './CardManagementDrawer';
import PresetManagementDrawer from './PresetManagementDrawer';

// Sortable Card Component
interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  isEditMode: boolean;
}

function SortableCard({ id, children, isEditMode }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="listitem"
      tabIndex={0}
      className={cn(
        "relative w-full h-full min-h-[200px] p-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </div>
      )}
      {children}
    </div>
  );
}

interface DashboardLayoutProps {
  className?: string;
}

// Dashboard card registry
const DASHBOARD_CARDS = {
  todayAtGlance: {
    id: 'todayAtGlance',
    title: 'Today at a Glance',
    component: TodayAtAGlance,
    minW: 6,
    minH: 2,
    maxW: 12,
    maxH: 3,
    defaultW: 12,
    defaultH: 2,
    pinned: false,
    description: 'Key metrics and stats for today',
    category: 'analytics'
  },
  syncProgress: {
    id: 'syncProgress',
    title: 'Sync Progress',
    component: CompactSyncProgress,
    minW: 3,
    minH: 2,
    maxW: 6,
    maxH: 3,
    defaultW: 4,
    defaultH: 2,
    pinned: false,
    description: 'Integration sync status and progress',
    category: 'integrations'
  },
  leadFeed: {
    id: 'leadFeed',
    title: 'Lead Feed',
    component: LeadFeed,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
    defaultW: 8,
    defaultH: 6,
    pinned: false,
    description: 'Recent leads and opportunities',
    category: 'leads'
  },
  activityFeed: {
    id: 'activityFeed',
    title: 'Live Activity',
    component: ActivityFeed,
    minW: 3,
    minH: 3,
    maxW: 8,
    maxH: 6,
    defaultW: 4,
    defaultH: 4,
    pinned: false,
    description: 'Real-time activity stream',
    category: 'activity'
  },
  healthWidget: {
    id: 'healthWidget',
    title: 'System Health',
    component: HealthWidget,
    minW: 3,
    minH: 2,
    maxW: 6,
    maxH: 3,
    defaultW: 4,
    defaultH: 2,
    pinned: true,
    description: 'Integration health and alerts',
    category: 'integrations'
  },
  pipelineSparkline: {
    id: 'pipelineSparkline',
    title: 'Pipeline Overview',
    component: MiniPipelineSparkline,
    minW: 4,
    minH: 2,
    maxW: 8,
    maxH: 3,
    defaultW: 6,
    defaultH: 2,
    pinned: false,
    description: 'Pipeline performance and trends',
    category: 'analytics'
  },
  propertySearch: {
    id: 'propertySearch',
    title: 'Property Search',
    component: PropertySearchWidget,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
    defaultW: 6,
    defaultH: 6,
    pinned: false,
    description: 'Search MLS listings',
    category: 'leads'
  }
};

// Layout presets
const LAYOUT_PRESETS = {
  default: {
    name: 'Default',
    description: 'Standard dashboard layout',
    layouts: {
      lg: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 12, h: 2 },
        { i: 'syncProgress', x: 0, y: 2, w: 4, h: 2 },
        { i: 'leadFeed', x: 4, y: 2, w: 8, h: 6 },
        { i: 'activityFeed', x: 0, y: 4, w: 4, h: 4 },
        { i: 'healthWidget', x: 8, y: 2, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 8, w: 6, h: 2 },
        { i: 'propertySearch', x: 6, y: 8, w: 6, h: 6 }
      ],
      md: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 8, h: 2 },
        { i: 'syncProgress', x: 0, y: 2, w: 4, h: 2 },
        { i: 'leadFeed', x: 0, y: 4, w: 8, h: 6 },
        { i: 'activityFeed', x: 0, y: 10, w: 8, h: 4 },
        { i: 'healthWidget', x: 4, y: 2, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 14, w: 8, h: 2 },
        { i: 'propertySearch', x: 0, y: 16, w: 8, h: 6 }
      ],
      sm: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 4, h: 2 },
        { i: 'syncProgress', x: 0, y: 2, w: 4, h: 2 },
        { i: 'leadFeed', x: 0, y: 4, w: 4, h: 6 },
        { i: 'activityFeed', x: 0, y: 10, w: 4, h: 4 },
        { i: 'healthWidget', x: 0, y: 14, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 16, w: 4, h: 2 },
        { i: 'propertySearch', x: 0, y: 18, w: 4, h: 6 }
      ]
    }
  },
  mobile: {
    name: 'Mobile First',
    description: 'Optimized ordering for phones',
    layouts: {
      lg: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 12, h: 2 },
        { i: 'syncProgress', x: 0, y: 2, w: 4, h: 2 },
        { i: 'leadFeed', x: 4, y: 2, w: 8, h: 6 },
        { i: 'activityFeed', x: 0, y: 4, w: 4, h: 4 },
        { i: 'healthWidget', x: 8, y: 2, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 8, w: 6, h: 2 }
      ],
      md: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 8, h: 2 },
        { i: 'syncProgress', x: 0, y: 2, w: 4, h: 2 },
        { i: 'leadFeed', x: 0, y: 4, w: 8, h: 6 },
        { i: 'activityFeed', x: 0, y: 10, w: 8, h: 4 },
        { i: 'healthWidget', x: 4, y: 2, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 14, w: 8, h: 2 }
      ],
      sm: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 2, w: 4, h: 2 },
        { i: 'leadFeed', x: 0, y: 4, w: 4, h: 6 },
        { i: 'activityFeed', x: 0, y: 10, w: 4, h: 4 },
        { i: 'syncProgress', x: 0, y: 14, w: 4, h: 2 },
        { i: 'healthWidget', x: 0, y: 16, w: 4, h: 2 }
      ]
    }
  },
  agent: {
    name: 'Agent',
    description: 'Focused on lead management and activity',
    layouts: {
      lg: [
        { i: 'leadFeed', x: 0, y: 0, w: 8, h: 8 },
        { i: 'activityFeed', x: 8, y: 0, w: 4, h: 6 },
        { i: 'todayAtGlance', x: 8, y: 6, w: 4, h: 2 },
        { i: 'healthWidget', x: 0, y: 8, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 4, y: 8, w: 4, h: 2 }
      ],
      md: [
        { i: 'leadFeed', x: 0, y: 0, w: 8, h: 8 },
        { i: 'activityFeed', x: 0, y: 8, w: 8, h: 4 },
        { i: 'todayAtGlance', x: 0, y: 12, w: 4, h: 2 },
        { i: 'healthWidget', x: 4, y: 12, w: 4, h: 2 }
      ],
      sm: [
        { i: 'leadFeed', x: 0, y: 0, w: 4, h: 8 },
        { i: 'activityFeed', x: 0, y: 8, w: 4, h: 4 },
        { i: 'todayAtGlance', x: 0, y: 12, w: 4, h: 2 },
        { i: 'healthWidget', x: 0, y: 14, w: 4, h: 2 }
      ]
    }
  },
  teamLead: {
    name: 'Team Lead',
    description: 'Analytics and team overview focused',
    layouts: {
      lg: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 12, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 2, w: 6, h: 3 },
        { i: 'leadFeed', x: 6, y: 2, w: 6, h: 6 },
        { i: 'activityFeed', x: 0, y: 5, w: 6, h: 4 },
        { i: 'healthWidget', x: 0, y: 9, w: 4, h: 2 },
        { i: 'syncProgress', x: 4, y: 9, w: 4, h: 2 }
      ],
      md: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 8, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 2, w: 8, h: 3 },
        { i: 'leadFeed', x: 0, y: 5, w: 8, h: 6 },
        { i: 'activityFeed', x: 0, y: 11, w: 8, h: 4 },
        { i: 'healthWidget', x: 0, y: 15, w: 4, h: 2 },
        { i: 'syncProgress', x: 4, y: 15, w: 4, h: 2 }
      ],
      sm: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 2, w: 4, h: 3 },
        { i: 'leadFeed', x: 0, y: 5, w: 4, h: 6 },
        { i: 'activityFeed', x: 0, y: 11, w: 4, h: 4 },
        { i: 'healthWidget', x: 0, y: 15, w: 4, h: 2 },
        { i: 'syncProgress', x: 0, y: 17, w: 4, h: 2 }
      ]
    }
  },
  ops: {
    name: 'Operations',
    description: 'System health and integrations focused',
    layouts: {
      lg: [
        { i: 'healthWidget', x: 0, y: 0, w: 6, h: 3 },
        { i: 'syncProgress', x: 6, y: 0, w: 6, h: 3 },
        { i: 'activityFeed', x: 0, y: 3, w: 4, h: 6 },
        { i: 'leadFeed', x: 4, y: 3, w: 8, h: 6 },
        { i: 'todayAtGlance', x: 0, y: 9, w: 6, h: 2 },
        { i: 'pipelineSparkline', x: 6, y: 9, w: 6, h: 2 }
      ],
      md: [
        { i: 'healthWidget', x: 0, y: 0, w: 4, h: 3 },
        { i: 'syncProgress', x: 4, y: 0, w: 4, h: 3 },
        { i: 'activityFeed', x: 0, y: 3, w: 8, h: 4 },
        { i: 'leadFeed', x: 0, y: 7, w: 8, h: 6 },
        { i: 'todayAtGlance', x: 0, y: 13, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 4, y: 13, w: 4, h: 2 }
      ],
      sm: [
        { i: 'healthWidget', x: 0, y: 0, w: 4, h: 3 },
        { i: 'syncProgress', x: 0, y: 3, w: 4, h: 3 },
        { i: 'activityFeed', x: 0, y: 6, w: 4, h: 4 },
        { i: 'leadFeed', x: 0, y: 10, w: 4, h: 6 },
        { i: 'todayAtGlance', x: 0, y: 16, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 18, w: 4, h: 2 }
      ]
    }
  }
};

export default function DashboardLayout({ className = '' }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState(LAYOUT_PRESETS.default.layouts);
  const [hiddenCards, setHiddenCards] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState('default');
  const [showCardDrawer, setShowCardDrawer] = useState(false);
  const [showPresetDrawer, setShowPresetDrawer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const customKeyboardCoordinates: KeyboardCoordinateGetter = (event, context) => {
    if (!isEditMode) return undefined;
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return sortableKeyboardCoordinates(event, context);
    }
    return undefined;
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: customKeyboardCoordinates,
    })
  );

  const saveLayoutMutation = trpc.saveLayout.useMutation();
  const loadLayoutMutation = trpc.loadLayout.useQuery(
    { userId: session?.user?.id || '' },
    { enabled: !!session?.user?.id }
  );

  // Load saved layout on mount
  useEffect(() => {
    if (loadLayoutMutation.data) {
      setLayouts(loadLayoutMutation.data.layouts);
      setHiddenCards(loadLayoutMutation.data.hiddenCardIds);
      setActivePreset(loadLayoutMutation.data.activePreset);
    }
  }, [loadLayoutMutation.data]);

  useEffect(() => {
    setAnnouncement(
      isEditMode
        ? 'Edit mode enabled. Use Alt plus arrow keys to move cards.'
        : 'Edit mode disabled.'
    );
  }, [isEditMode]);

  // Temporarily disable card scaling to fix initialization error
  // TODO: Re-enable once the '$' initialization error is resolved
  /*
  // Handle card scaling with ResizeObserver
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCardScales = () => {
      try {
        const cards = document.querySelectorAll('[data-card-id]');
        cards.forEach((card) => {
          const parent = card.closest('.react-grid-item');
          if (parent && card instanceof HTMLElement) {
            const rect = parent.getBoundingClientRect();
            const baseWidth = 400; // Base width for full scale
            const scale = Math.min(rect.width / baseWidth, 1);
            card.style.transform = `scale(${scale})`;
            card.style.transformOrigin = 'top left';
            card.style.width = `${100 / scale}%`;
            card.style.height = `${100 / scale}%`;
          }
        });
      } catch (error) {
        console.warn('Error updating card scales:', error);
      }
    };

    // Use ResizeObserver for better performance
    let resizeObserver: ResizeObserver | null = null;
    
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateCardScales);
      });
      
      const gridContainer = document.querySelector('.dashboard-grid');
      if (gridContainer) {
        resizeObserver.observe(gridContainer);
      }
    }

    // Initial scale calculation
    const timeoutId = setTimeout(updateCardScales, 100);

    // Handle window resize as fallback
    const handleResize = () => requestAnimationFrame(updateCardScales);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [layouts, visibleCards]);
  */

  // Save layout when it changes
  const handleLayoutChange = useCallback((currentLayout: any, allLayouts: any) => {
    // Ensure all items snap to grid properly
    const snappedLayouts = Object.keys(allLayouts).reduce((acc, breakpoint) => {
      acc[breakpoint] = allLayouts[breakpoint].map((item: any) => ({
        ...item,
        x: Math.round(item.x),
        y: Math.round(item.y),
        w: Math.max(1, Math.round(item.w)),
        h: Math.max(1, Math.round(item.h))
      }));
      return acc;
    }, {} as any);
    
    setLayouts(snappedLayouts);
    
    // Debounced save
    const timeoutId = setTimeout(() => {
      if (session?.user?.id) {
        saveLayoutMutation.mutate({
          userId: session.user.id,
          layouts: snappedLayouts,
          hiddenCardIds: hiddenCards,
          activePreset
        });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [session?.user?.id, hiddenCards, activePreset, saveLayoutMutation]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = visibleCards.indexOf(active.id as string);
      const newIndex = visibleCards.indexOf(over?.id as string);
      
      const newOrder = arrayMove(visibleCards, oldIndex, newIndex);
      // Update the visible cards order
      setVisibleCards(newOrder);
      
      // Save the new order to the database
      if (session?.user?.id) {
        saveLayoutMutation.mutate({
          userId: session.user.id,
          layouts: layouts,
          hiddenCardIds: hiddenCards,
          activePreset,
          cardOrder: newOrder
        });
      }
    }
    
    setIsDragging(false);
  };

  const toggleCardVisibility = (cardId: string) => {
    setHiddenCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const applyPreset = (presetName: string) => {
    const preset = LAYOUT_PRESETS[presetName as keyof typeof LAYOUT_PRESETS];
    if (preset) {
      setLayouts(preset.layouts);
      setActivePreset(presetName);
      setShowPresetDrawer(false);
    }
  };

  const resetToDefault = () => {
    setLayouts(LAYOUT_PRESETS.default.layouts);
    setHiddenCards([]);
    setActivePreset('default');
  };

  const renderCard = (cardId: string) => {
    const cardConfig = DASHBOARD_CARDS[cardId as keyof typeof DASHBOARD_CARDS];
    if (!cardConfig) return null;

    const Component = cardConfig.component;
    return (
      <DashboardCard key={cardId} data-card-id={cardId} className="h-full w-full">
        <Component className="h-full" />
      </DashboardCard>
    );
  };

  const [visibleCards, setVisibleCards] = useState<string[]>(
    Object.keys(DASHBOARD_CARDS).filter(cardId => !hiddenCards.includes(cardId))
  );

  return (
    <div className={cn("relative", className)}>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {/* Edit Mode Toolbar */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-40 bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-800/90 backdrop-blur-md border-b border-border/50 p-4 shadow-lg"
          >
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Grid3X3 className="h-3 w-3" />
                  Edit Mode
                </Badge>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Drag cards to rearrange • Resize corners to adjust size
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCardDrawer(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Cards
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPresetDrawer(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Presets
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => setIsEditMode(false)}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save & Exit
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dashboard Grid with Drag & Drop */}
      <div className="p-2 h-full">
        <div className="max-w-full mx-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleCards}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full auto-rows-fr">
                {visibleCards.map(cardId => (
                  <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                    {renderCard(cardId)}
                  </SortableCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

             {/* Edit Mode Toggle Button */}
       {!isEditMode && (
         <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="fixed bottom-6 right-24 z-50"
         >
           <Button
             onClick={() => setIsEditMode(true)}
             className="rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white"
             size="lg"
           >
             <Settings className="h-5 w-5 mr-2" />
             Customize
           </Button>
         </motion.div>
       )}

      {/* Card Management Drawer */}
      <CardManagementDrawer
        isOpen={showCardDrawer}
        onClose={() => setShowCardDrawer(false)}
        hiddenCards={hiddenCards}
        onToggleCard={toggleCardVisibility}
        cards={DASHBOARD_CARDS}
      />

      {/* Preset Management Drawer */}
      <PresetManagementDrawer
        isOpen={showPresetDrawer}
        onClose={() => setShowPresetDrawer(false)}
        presets={LAYOUT_PRESETS}
        activePreset={activePreset}
        onApplyPreset={applyPreset}
      />
    </div>
  );
}
