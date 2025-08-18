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

interface PresetLayout {
  name: string;
  description: string;
  layouts: Record<string, any[]>;
}

interface PresetManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  presets: Record<string, PresetLayout>;
  activePreset: string;
  onApplyPreset: (presetName: string) => void;
}

const presetIcons = {
  default: Sparkles,
  agent: Users,
  teamLead: BarChart3,
  ops: Settings
};

const presetColors = {
  default: 'bg-gradient-to-r from-blue-500 to-teal-500',
  agent: 'bg-gradient-to-r from-purple-500 to-pink-500',
  teamLead: 'bg-gradient-to-r from-green-500 to-emerald-500',
  ops: 'bg-gradient-to-r from-orange-500 to-red-500'
};

const presetFeatures = {
  default: ['Balanced overview', 'All key metrics', 'Standard layout'],
  agent: ['Lead-focused', 'Activity stream', 'Quick actions'],
  teamLead: ['Analytics heavy', 'Team overview', 'Performance tracking'],
  ops: ['System health', 'Integration status', 'Operational metrics']
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
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
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
              <div className="space-y-6">
                {Object.entries(presets).map(([presetKey, preset]) => {
                  const Icon = presetIcons[presetKey as keyof typeof presetIcons];
                  const isActive = activePreset === presetKey;
                  const features = presetFeatures[presetKey as keyof typeof presetFeatures] || [];
                  
                  return (
                    <motion.div
                      key={presetKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-6 rounded-lg border transition-all duration-200 cursor-pointer",
                        isActive 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                      onClick={() => handleApplyPreset(presetKey)}
                    >
                      {/* Preset Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                            presetColors[presetKey as keyof typeof presetColors]
                          )}>
                            {Icon && <Icon className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className={cn(
                              "font-semibold",
                              isActive 
                                ? "text-blue-900 dark:text-blue-100" 
                                : "text-slate-900 dark:text-white"
                            )}>
                              {preset.name}
                            </h3>
                            <p className={cn(
                              "text-sm",
                              isActive 
                                ? "text-blue-700 dark:text-blue-300" 
                                : "text-slate-600 dark:text-slate-400"
                            )}>
                              {preset.description}
                            </p>
                          </div>
                        </div>
                        
                        {isActive && (
                          <Badge className="bg-blue-500 text-white">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>

                      {/* Features */}
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Features
                        </h4>
                        <div className="space-y-1">
                          {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                              <span className={cn(
                                isActive 
                                  ? "text-blue-700 dark:text-blue-300" 
                                  : "text-slate-600 dark:text-slate-400"
                              )}>
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Layout Preview */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Layout Preview
                        </h4>
                        <div className="grid grid-cols-6 gap-1 h-16 bg-slate-100 dark:bg-slate-800 rounded p-2">
                          {preset.layouts.lg?.slice(0, 6).map((item, index) => (
                            <div
                              key={index}
                              className={cn(
                                "rounded-sm",
                                item.i === 'todayAtGlance' && "bg-blue-200 dark:bg-blue-800",
                                item.i === 'leadFeed' && "bg-purple-200 dark:bg-purple-800",
                                item.i === 'activityFeed' && "bg-orange-200 dark:bg-orange-800",
                                item.i === 'healthWidget' && "bg-green-200 dark:bg-green-800",
                                item.i === 'syncProgress' && "bg-teal-200 dark:bg-teal-800",
                                item.i === 'pipelineSparkline' && "bg-indigo-200 dark:bg-indigo-800"
                              )}
                              style={{
                                gridColumn: `span ${Math.min(item.w, 6)}`,
                                gridRow: `span ${Math.min(item.h, 2)}`
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Apply Button */}
                      <div className="mt-4">
                        <Button
                          variant={isActive ? "outline" : "default"}
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPreset(presetKey);
                          }}
                        >
                          {isActive ? 'Currently Active' : 'Apply Preset'}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p className="mb-2">
                  <strong>Tip:</strong> You can customize any preset after applying it.
                </p>
                <p>
                  Your current layout will be saved before applying a new preset.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
