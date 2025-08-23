"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Home, 
  Mail, 
  Users, 
  Calendar, 
  FileText, 
  BarChart, 
  Settings,
  Sparkles,
  MessageSquare,
  CheckCircle,
  Bot,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface SimpleOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Rivor',
    description: 'Your complete real estate CRM solution',
    icon: <Sparkles className="h-6 w-6" />,
    content: (
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center mb-6">
          <Home className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold">Welcome to Rivor!</h3>
        <p className="text-lg opacity-90">
          Let's get you started with a quick tour of your new real estate workspace.
        </p>
        <div className="flex items-center justify-center flex-wrap gap-3 pt-4">
          <Badge variant="outline" className="text-sm">
            <Users className="h-4 w-4 mr-2" />
            Lead Management
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Mail className="h-4 w-4 mr-2" />
            Email Integration
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar Sync
          </Badge>
        </div>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'Get a quick overview of your business',
    icon: <Home className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Dashboard Overview</h3>
        <p className="opacity-90">
          Your dashboard provides a real-time view of your business metrics, recent activities, and important notifications.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <BarChart className="h-8 w-8 text-blue-500 mb-2" />
            <h4 className="font-semibold">Analytics</h4>
            <p className="text-sm opacity-80">Track your performance</p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <Users className="h-8 w-8 text-green-500 mb-2" />
            <h4 className="font-semibold">Quick Stats</h4>
            <p className="text-sm opacity-80">See your key metrics</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'inbox',
    title: 'Email Inbox',
    description: 'Manage all your communications',
    icon: <Mail className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Unified Inbox</h3>
        <p className="opacity-90">
          Connect your email accounts and manage all communications from one place. Never miss an important message from a client.
        </p>
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-500/10 border border-slate-500/20">
            <Mail className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <p className="font-medium">Email Integration</p>
              <p className="text-sm opacity-80">Gmail, Outlook, and more</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-500/10 border border-slate-500/20">
            <MessageSquare className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <p className="font-medium">AI-Powered Responses</p>
              <p className="text-sm opacity-80">Smart reply suggestions</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'pipeline',
    title: 'Deal Pipeline',
    description: 'Track your deals from lead to close',
    icon: <BarChart className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Sales Pipeline</h3>
        <p className="opacity-90">
          Visualize and manage your deals through every stage. From initial contact to closing, track progress and never lose a deal.
        </p>
        <div className="flex justify-between mt-6">
          <div className="text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 font-semibold">1</span>
            </div>
            <p className="text-sm font-medium">Prospect</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 mt-4" />
          <div className="text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-semibold">2</span>
            </div>
            <p className="text-sm font-medium">Qualified</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 mt-4" />
          <div className="text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-semibold">3</span>
            </div>
            <p className="text-sm font-medium">Closed</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'ai-chat',
    title: 'AI Assistant',
    description: 'Your intelligent real estate companion',
    icon: <Bot className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Meet Your AI Assistant</h3>
        <p className="opacity-90">
          Get instant help with property research, market analysis, and client communication. Your AI assistant is available 24/7.
        </p>
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium">AI Chat Assistant</p>
              <p className="text-sm opacity-80">Always ready to help</p>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 text-sm">
            <p className="font-medium text-purple-600">Try asking:</p>
            <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-300">
              <li>• "What's the market like in downtown?"</li>
              <li>• "Help me draft an email to a client"</li>
              <li>• "Create a follow-up task"</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'settings',
    title: 'Personalize Your Experience',
    description: 'Customize Rivor to work for you',
    icon: <Settings className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Make It Yours</h3>
        <p className="opacity-90">
          Customize themes, set up notifications, and configure integrations to match your workflow.
        </p>
        <div className="grid grid-cols-1 gap-3 mt-6">
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center">
                <Palette className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium">Theme Selection</p>
                <p className="text-sm opacity-80">Light or dark glass themes</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm opacity-80">Email, push, and in-app alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Ready to grow your real estate business',
    icon: <CheckCircle className="h-6 w-6" />,
    content: (
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold">Welcome Aboard!</h3>
        <p className="text-lg opacity-90">
          You're ready to start managing your real estate business with Rivor.
        </p>
        <div className="bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
          <p className="font-medium text-blue-600">Pro Tip</p>
          <p className="text-sm opacity-80 mt-1">
            Click the AI assistant in the bottom-right corner anytime you need help or want to explore features.
          </p>
        </div>
      </div>
    )
  }
];

export default function SimpleOnboarding({ onComplete, onSkip }: SimpleOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl mx-4 glass-modal rounded-xl p-8 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--glass-surface)',
                  color: 'var(--glass-primary)'
                }}
              >
                {step.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--glass-text)' }}>
                  {step.title}
                </h2>
                <p className="text-sm opacity-80" style={{ color: 'var(--glass-text-secondary)' }}>
                  {step.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span style={{ color: 'var(--glass-text-secondary)' }}>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span style={{ color: 'var(--glass-text-secondary)' }}>
                {Math.round(progress)}% complete
              </span>
            </div>
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--glass-surface)' }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
            style={{ color: 'var(--glass-text)' }}
          >
            {step.content}
          </motion.div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-blue-500 w-6'
                      : index <= currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
              
              {currentStep === 0 && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                >
                  Skip Tour
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white border-none"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Get Started
                    <CheckCircle className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}