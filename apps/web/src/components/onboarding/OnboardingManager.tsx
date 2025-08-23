"use client";

import { useState, useEffect } from 'react';
import OnboardingWalkthrough from './OnboardingWalkthrough';
import AIOnboardingAgent from './AIOnboardingAgent';

interface ToneAnalysis {
  overallTone: string;
  communicationStyle: string;
  preferredFormality: string;
  keyPersonalityTraits: string[];
  businessFocus: string[];
  confidence: number;
}

interface OnboardingManagerProps {
  children: React.ReactNode;
}

export default function OnboardingManager({ children }: OnboardingManagerProps) {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/user/onboarding');
      if (response.ok) {
        const status = await response.json();
        setOnboardingStatus(status);
        
        // Show walkthrough if user is new and hasn't completed onboarding
        if (status.isFirstTime && !status.isComplete) {
          setShowWalkthrough(true);
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false);
    
    // Check if AI chat step is pending
    const aiChatStep = onboardingStatus?.steps?.find((step: any) => step.id === 'ai_chat');
    if (aiChatStep && !aiChatStep.completed) {
      setShowAIAgent(true);
    }
  };

  const handleWalkthroughSkip = () => {
    setShowWalkthrough(false);
  };

  const handleAIAgentComplete = async (analysis: ToneAnalysis) => {
    console.log('User tone analysis completed:', analysis);
    
    // Mark AI chat step as complete
    try {
      await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: 'ai_chat', completed: true })
      });
    } catch (error) {
      console.error('Failed to mark AI chat as complete:', error);
    }
    
    setShowAIAgent(false);
    
    // Refresh onboarding status
    await checkOnboardingStatus();
  };

  const handleAIAgentClose = () => {
    setShowAIAgent(false);
  };

  // Don't render anything while loading
  if (loading) {
    return <div>{children}</div>;
  }

  return (
    <>
      {children}
      
      <OnboardingWalkthrough
        onComplete={handleWalkthroughComplete}
        onSkip={handleWalkthroughSkip}
      />
      
      <AIOnboardingAgent
        isOpen={showAIAgent}
        onClose={handleAIAgentClose}
        onComplete={handleAIAgentComplete}
      />
    </>
  );
}