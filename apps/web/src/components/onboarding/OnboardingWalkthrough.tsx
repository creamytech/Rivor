"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Mail, 
  Calendar, 
  Bot, 
  Target,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
  Circle,
  Sparkles,
  ArrowRight,
  Play
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
}

interface OnboardingStatus {
  steps: OnboardingStep[];
  progress: number;
  completedSteps: number;
  totalSteps: number;
  isComplete: boolean;
  isFirstTime: boolean;
}

interface OnboardingWalkthroughProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const stepIcons = {
  profile_setup: User,
  email_integration: Mail,
  calendar_integration: Calendar,
  ai_chat: Bot,
  first_lead: Target
};

const stepColors = {
  profile_setup: 'blue',
  email_integration: 'green',
  calendar_integration: 'purple',
  ai_chat: 'pink',
  first_lead: 'orange'
};

export default function OnboardingWalkthrough({ onComplete, onSkip }: OnboardingWalkthroughProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/user/onboarding');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setLoading(false);
        
        // Show walkthrough if user is new and hasn't completed onboarding
        if (data.isFirstTime && !data.isComplete) {
          setIsOpen(true);
          // Set current step to first incomplete step
          const firstIncompleteIndex = data.steps.findIndex((step: OnboardingStep) => !step.completed);
          setCurrentStepIndex(Math.max(0, firstIncompleteIndex));
        }
      }
    } catch (error) {
      console.error('Failed to fetch onboarding status:', error);
      setLoading(false);
    }
  };

  const markStepComplete = async (stepId: string) => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, completed: true })
      });
      
      // Refresh status
      await fetchOnboardingStatus();
    } catch (error) {
      console.error('Failed to mark step complete:', error);
    }
  };

  const handleStepAction = async (step: OnboardingStep) => {
    switch (step.id) {
      case 'profile_setup':
        // Navigate to profile settings
        window.location.href = '/app/settings?tab=profile';
        break;
      case 'email_integration':
        // Navigate to integrations
        window.location.href = '/app/settings?tab=integrations';
        break;
      case 'calendar_integration':
        // Navigate to calendar integration
        window.location.href = '/app/settings?tab=integrations';
        break;
      case 'ai_chat':
        // Close walkthrough and show AI chat
        setIsOpen(false);
        if (onComplete) {
          onComplete();
        }
        break;
      case 'first_lead':
        // Navigate to leads page
        window.location.href = '/app/pipeline';
        break;
    }
  };

  const nextStep = () => {
    if (status && currentStepIndex < status.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    if (onSkip) {
      onSkip();
    }
  };

  const handleFinish = async () => {
    setIsOpen(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (loading || !status) {
    return null;
  }

  const currentStep = status.steps[currentStepIndex];
  const StepIcon = currentStep ? stepIcons[currentStep.id as keyof typeof stepIcons] : User;
  const stepColor = currentStep ? stepColors[currentStep.id as keyof typeof stepColors] : 'blue';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={`max-w-2xl ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
        <div className="glass-card glass-border-active" style={{ backgroundColor: 'var(--glass-surface)' }}>
          <DialogHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="glass-icon-container">
                  <Sparkles className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold glass-text-gradient">
                    Welcome to Rivor!
                  </DialogTitle>
                  <DialogDescription className="text-base mt-1" style={{ color: 'var(--glass-text-muted)' }}>
                    Let's get you set up in just a few simple steps
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--glass-text-muted)' }}>
                  Step {currentStepIndex + 1} of {status.steps.length}
                </span>
                <span style={{ color: 'var(--glass-text-muted)' }}>
                  {status.progress}% Complete
                </span>
              </div>
              <Progress value={status.progress} className="glass-progress" />
            </div>
          </DialogHeader>

          <div className="py-6">
            <AnimatePresence mode="wait">
              {currentStep && (
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Current Step */}
                  <div className="glass-card glass-border p-6" style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                    <div className="flex items-start gap-4">
                      <div className={`glass-icon-container text-${stepColor}-500`}>
                        <StepIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold glass-text-gradient">
                            {currentStep.title}
                          </h3>
                          {currentStep.completed && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {currentStep.required && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--glass-text-muted)' }}>
                          {currentStep.description}
                        </p>
                        
                        {!currentStep.completed && (
                          <Button
                            variant="liquid"
                            onClick={() => handleStepAction(currentStep)}
                            className="glass-hover-glow"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Get Started
                          </Button>
                        )}
                        
                        {currentStep.completed && (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Steps Overview */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--glass-text)' }}>
                      All Steps
                    </h4>
                    <div className="space-y-2">
                      {status.steps.map((step, index) => {
                        const Icon = stepIcons[step.id as keyof typeof stepIcons];
                        const isActive = index === currentStepIndex;
                        
                        return (
                          <button
                            key={step.id}
                            onClick={() => setCurrentStepIndex(index)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left',
                              'glass-button-hover',
                              isActive ? 'glass-button-active' : 'glass-button-secondary',
                              step.completed && 'opacity-75'
                            )}
                          >
                            <div className="flex-shrink-0">
                              {step.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5" style={{ color: 'var(--glass-text-muted)' }} />
                              )}
                            </div>
                            <Icon className={`h-4 w-4 flex-shrink-0 text-${stepColors[step.id as keyof typeof stepColors]}-500`} />
                            <div className="flex-1">
                              <span className="text-sm font-medium">{step.title}</span>
                              {step.required && (
                                <span className="ml-2 text-xs text-red-500">*</span>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--glass-text-muted)' }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="glass-button-secondary"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleSkip} className="glass-button-secondary">
                Skip for now
              </Button>
              
              {currentStepIndex < status.steps.length - 1 ? (
                <Button variant="liquid" onClick={nextStep} className="glass-hover-glow">
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button variant="liquid" onClick={handleFinish} className="glass-hover-glow">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Finish Setup
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}