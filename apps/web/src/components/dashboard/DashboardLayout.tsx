"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-grid-utils/css/styles.css';
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
  Unlock
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// Import dashboard cards
import TodayAtAGlance from '@/components/app/TodayAtAGlance';
import CompactSyncProgress from '@/components/app/CompactSyncProgress';
import LeadFeed from '@/components/app/LeadFeed';
import ActivityFeed from '@/components/app/ActivityFeed';
import HealthWidget from '@/components/app/HealthWidget';
import MiniPipelineSparkline from '@/components/app/MiniPipelineSparkline';
import CurvedDivider from '@/components/ui/curved-divider';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Dashboard card definitions
export const DASHBOARD_CARDS = {
  todayAtGlance: {
    id: 'todayAtGlance',
    title: 'Today at a Glance',
    component: TodayAtAGlance,
    minW: 3,
    minH: 2,
    defaultW: 12,
    defaultH: 2,
    pinned: false,
    description: 'Key metrics and stats for today',
    category: 'overview'
  },
  syncProgress: {
    id: 'syncProgress',
    title: 'Sync Progress',
    component: CompactSyncProgress,
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 2,
    pinned: false,
    description: 'Email and calendar sync status',
    category: 'system'
  },
  leadFeed: {
    id: 'leadFeed',
    title: 'Lead Feed',
    component: LeadFeed,
    minW: 4,
    minH: 4,
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
    minH: 4,
    defaultW: 4,
    defaultH: 6,
    pinned: false,
    description: 'Real-time activity updates',
    category: 'activity'
  },
  healthWidget: {
    id: 'healthWidget',
    title: 'System Health',
    component: HealthWidget,
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 2,
    pinned: false,
    description: 'Integration and system status',
    category: 'system'
  },
  pipelineSparkline: {
    id: 'pipelineSparkline',
    title: 'Pipeline Overview',
    component: MiniPipelineSparkline,
    minW: 3,
    minH: 2,
    defaultW: 6,
    defaultH: 2,
    pinned: false,
    description: 'Pipeline performance metrics',
    category: 'pipeline'
  }
};

// Preset layouts
export const LAYOUT_PRESETS = {
  default: {
    name: 'Default',
    description: 'Balanced overview for daily use',
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
        { i: 'syncProgress', x: 0, y: 2, w: 4, h: 2 },
        { i: 'leadFeed', x: 0, y: 4, w: 4, h: 6 },
        { i: 'activityFeed', x: 0, y: 10, w: 4, h: 4 },
        { i: 'healthWidget', x: 0, y: 14, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 16, w: 4, h: 2 }
      ]
    }
  },
  agent: {
    name: 'Agent Focus',
    description: 'Optimized for lead management',
    layouts: {
      lg: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 8, h: 2 },
        { i: 'leadFeed', x: 0, y: 2, w: 8, h: 8 },
        { i: 'activityFeed', x: 8, y: 0, w: 4, h: 10 },
        { i: 'pipelineSparkline', x: 0, y: 10, w: 6, h: 2 },
        { i: 'healthWidget', x: 6, y: 10, w: 6, h: 2 }
      ],
      md: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 8, h: 2 },
        { i: 'leadFeed', x: 0, y: 2, w: 8, h: 8 },
        { i: 'activityFeed', x: 0, y: 10, w: 8, h: 4 },
        { i: 'pipelineSparkline', x: 0, y: 14, w: 4, h: 2 },
        { i: 'healthWidget', x: 4, y: 14, w: 4, h: 2 }
      ],
      sm: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 4, h: 2 },
        { i: 'leadFeed', x: 0, y: 2, w: 4, h: 8 },
        { i: 'activityFeed', x: 0, y: 10, w: 4, h: 4 },
        { i: 'pipelineSparkline', x: 0, y: 14, w: 4, h: 2 },
        { i: 'healthWidget', x: 0, y: 16, w: 4, h: 2 }
      ]
    }
  },
  teamLead: {
    name: 'Team Lead',
    description: 'Overview focused on team performance',
    layouts: {
      lg: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 12, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 2, w: 6, h: 3 },
        { i: 'activityFeed', x: 6, y: 2, w: 6, h: 6 },
        { i: 'leadFeed', x: 0, y: 5, w: 6, h: 6 },
        { i: 'healthWidget', x: 0, y: 11, w: 6, h: 2 },
        { i: 'syncProgress', x: 6, y: 8, w: 6, h: 2 }
      ],
      md: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 8, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 2, w: 8, h: 3 },
        { i: 'activityFeed', x: 0, y: 5, w: 8, h: 4 },
        { i: 'leadFeed', x: 0, y: 9, w: 8, h: 6 },
        { i: 'healthWidget', x: 0, y: 15, w: 4, h: 2 },
        { i: 'syncProgress', x: 4, y: 15, w: 4, h: 2 }
      ],
      sm: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 2, w: 4, h: 3 },
        { i: 'activityFeed', x: 0, y: 5, w: 4, h: 4 },
        { i: 'leadFeed', x: 0, y: 9, w: 4, h: 6 },
        { i: 'healthWidget', x: 0, y: 15, w: 4, h: 2 },
        { i: 'syncProgress', x: 0, y: 17, w: 4, h: 2 }
      ]
    }
  },
  ops: {
    name: 'Operations',
    description: 'System health and monitoring focus',
    layouts: {
      lg: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 6, h: 2 },
        { i: 'healthWidget', x: 6, y: 0, w: 6, h: 2 },
        { i: 'syncProgress', x: 0, y: 2, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 4, y: 2, w: 8, h: 2 },
        { i: 'activityFeed', x: 0, y: 4, w: 6, h: 8 },
        { i: 'leadFeed', x: 6, y: 4, w: 6, h: 8 }
      ],
      md: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 4, h: 2 },
        { i: 'healthWidget', x: 4, y: 0, w: 4, h: 2 },
        { i: 'syncProgress', x: 0, y: 2, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 4, y: 2, w: 4, h: 2 },
        { i: 'activityFeed', x: 0, y: 4, w: 8, h: 4 },
        { i: 'leadFeed', x: 0, y: 8, w: 8, h: 6 }
      ],
      sm: [
        { i: 'todayAtGlance', x: 0, y: 0, w: 4, h: 2 },
        { i: 'healthWidget', x: 0, y: 2, w: 4, h: 2 },
        { i: 'syncProgress', x: 0, y: 4, w: 4, h: 2 },
        { i: 'pipelineSparkline', x: 0, y: 6, w: 4, h: 2 },
        { i: 'activityFeed', x: 0, y: 8, w: 4, h: 4 },
        { i: 'leadFeed', x: 0, y: 12, w: 4, h: 6 }
      ]
    }
  }
};

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

interface DashboardLayoutProps {
  className?: string;
}

export default function DashboardLayout({ className = '' }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState(LAYOUT_PRESETS.default.layouts);
  const [hiddenCards, setHiddenCards] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState('default');
  const [showCardDrawer, setShowCardDrawer] = useState(false);
  const [showPresetDrawer, setShowPresetDrawer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // tRPC mutations for layout persistence
  const saveLayoutMutation = trpc.dashboard.saveLayout.useMutation();
  const loadLayoutMutation = trpc.dashboard.loadLayout.useQuery(
    { userId: session?.user?.id || '' },
    { enabled: !!session?.user?.id }
  );

  // Load saved layout on mount
  useEffect(() => {
    if (loadLayoutMutation.data) {
      const savedLayout = loadLayoutMutation.data;
      if (savedLayout.layouts) {
        setLayouts(savedLayout.layouts);
      }
      if (savedLayout.hiddenCardIds) {
        setHiddenCards(savedLayout.hiddenCardIds);
      }
      if (savedLayout.activePreset) {
        setActivePreset(savedLayout.activePreset);
      }
    }
  }, [loadLayoutMutation.data]);

  // Save layout with debouncing
  const saveLayout = useCallback(
    async (newLayouts: any, newHiddenCards: string[], newPreset: string) => {
      if (!session?.user?.id) return;

      try {
        await saveLayoutMutation.mutateAsync({
          userId: session.user.id,
          layouts: newLayouts,
          hiddenCardIds: newHiddenCards,
          activePreset: newPreset
        });
      } catch (error) {
        console.error('Failed to save layout:', error);
      }
    },
    [session?.user?.id, saveLayoutMutation]
  );

  // Debounced save effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveLayout(layouts, hiddenCards, activePreset);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [layouts, hiddenCards, activePreset, saveLayout]);

  const handleLayoutChange = useCallback((currentLayout: LayoutItem[], allLayouts: any) => {
    setLayouts(allLayouts);
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragStop = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleCardVisibility = useCallback((cardId: string) => {
    setHiddenCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const preset = LAYOUT_PRESETS[presetName as keyof typeof LAYOUT_PRESETS];
    if (preset) {
      setLayouts(preset.layouts);
      setActivePreset(presetName);
      setShowPresetDrawer(false);
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setLayouts(LAYOUT_PRESETS.default.layouts);
    setHiddenCards([]);
    setActivePreset('default');
  }, []);

  const renderCard = useCallback((cardId: string) => {
    const cardConfig = DASHBOARD_CARDS[cardId as keyof typeof DASHBOARD_CARDS];
    if (!cardConfig || hiddenCards.includes(cardId)) return null;

    const CardComponent = cardConfig.component;
    
    return (
      <motion.div
        key={cardId}
        className={cn(
          "h-full w-full",
          isEditMode && "cursor-move",
          isDragging && "pointer-events-none"
        )}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <CardComponent />
      </motion.div>
    );
  }, [hiddenCards, isEditMode, isDragging]);

  return (
    <div className={cn("relative", className)}>
      {/* Edit Mode Toolbar */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-4 mb-6"
          >
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-2">
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
                  variant="default"
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

      {/* Main Dashboard Grid */}
      <div className="relative">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 8, sm: 4, xs: 4, xxs: 2 }}
          rowHeight={80}
          margin={[16, 16]}
          containerPadding={[16, 16]}
          onLayoutChange={handleLayoutChange}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          onResizeStart={handleDragStart}
          onResizeStop={handleDragStop}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          useCSSTransforms={true}
          preventCollision={false}
          compactType="vertical"
          autoSize={true}
        >
          {Object.keys(DASHBOARD_CARDS).map(cardId => (
            <div key={cardId} className="relative">
              {renderCard(cardId)}
              
              {/* Edit Mode Overlay */}
              {isEditMode && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700"
                      onClick={() => toggleCardVisibility(cardId)}
                    >
                      <EyeOff className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Edit Mode Toggle Button */}
      {!isEditMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-20 right-6 z-40"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(true)}
            className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg"
          >
            <Settings className="h-4 w-4" />
            Customize
          </Button>
        </motion.div>
      )}

      {/* Card Management Drawer */}
      <AnimatePresence>
        {showCardDrawer && (
          <CardManagementDrawer
            isOpen={showCardDrawer}
            onClose={() => setShowCardDrawer(false)}
            hiddenCards={hiddenCards}
            onToggleCard={toggleCardVisibility}
            cards={DASHBOARD_CARDS}
          />
        )}
      </AnimatePresence>

      {/* Preset Management Drawer */}
      <AnimatePresence>
        {showPresetDrawer && (
          <PresetManagementDrawer
            isOpen={showPresetDrawer}
            onClose={() => setShowPresetDrawer(false)}
            presets={LAYOUT_PRESETS}
            activePreset={activePreset}
            onApplyPreset={applyPreset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
