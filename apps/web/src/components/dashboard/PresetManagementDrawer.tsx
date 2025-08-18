"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Check, 
  Users, 
  BarChart3, 
  Settings, 
  Activity,
  Sparkles,
  Target,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PresetConfig {
  name: string;
  description: string;
  layouts: Record<string, any[]>;
}

interface PresetManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  presets: Record<string, PresetConfig>;
  activePreset: string;
  onApplyPreset: (presetName: string) => void;
}

const presetIcons = {
  default: BarChart3,
  agent: Users,
  teamLead: Target,
  ops: Settings
};

const presetColors = {
  default: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  agent: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  teamLead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  ops: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
};

const presetFeatures = {
  default: ['Balanced overview', 'Daily metrics', 'Quick actions'],
  agent: ['Lead focus', 'Activity feed', 'Pipeline view'],
  teamLead: ['Team performance', 'Overview metrics', 'Management tools'],
  ops: ['System health', 'Monitoring', 'Operations focus']
};

export default function PresetManagementDrawer({
  isOpen,
  onClose,
  presets,
  activePreset,
  onApplyPreset
}: PresetManagementDrawerProps) {
  const handleApplyPreset = (presetName: string) => {
    onApplyPreset(presetName);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-50 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Layout Presets
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Choose a dashboard layout template
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Presets List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {Object.entries(presets).map(([presetKey, preset]) => {
                  const Icon = presetIcons[presetKey as keyof typeof presetIcons];
                  const colorClass = presetColors[presetKey as keyof typeof presetColors];
                  const features = presetFeatures[presetKey as keyof typeof presetFeatures];
                  const isActive = activePreset === presetKey;
                  
                  return (
                    <motion.div
                      key={presetKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                        isActive 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                      onClick={() => handleApplyPreset(presetKey)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isActive ? "bg-blue-100 dark:bg-blue-900/40" : "bg-slate-100 dark:bg-slate-800"
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                            )} />
                          </div>
                          <div>
                            <h4 className={cn(
                              "font-medium",
                              isActive ? "text-blue-900 dark:text-blue-100" : "text-slate-900 dark:text-slate-100"
                            )}>
                              {preset.name}
                            </h4>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs mt-1", colorClass)}
                            >
                              {presetKey === 'default' ? 'Recommended' : 'Template'}
                            </Badge>
                          </div>
                        </div>
                        
                        {isActive && (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                      </div>
                      
                      <p className={cn(
                        "text-sm mb-3",
                        isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {preset.description}
                      </p>
                      
                      {/* Features */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Features
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {features.map((feature, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs px-2 py-1"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Layout Preview */}
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                          Layout Preview
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {Object.entries(preset.layouts.lg || {}).slice(0, 6).map(([cardId, layout]: [string, any]) => (
                            <div
                              key={cardId}
                              className="bg-slate-200 dark:bg-slate-700 rounded"
                              style={{
                                gridColumn: `span ${Math.min(layout.w, 2)}`,
                                gridRow: `span ${Math.min(layout.h, 2)}`,
                                height: `${Math.min(layout.h, 2) * 8}px`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Presets are optimized for different roles and workflows</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Shield className="h-4 w-4" />
                  <span>Your current layout will be saved before applying a preset</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
