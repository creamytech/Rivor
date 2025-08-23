"use client";

import { useState, useEffect } from 'react';
import SimpleOnboarding from './SimpleOnboarding';

interface OnboardingManagerProps {
  children: React.ReactNode;
}

export default function OnboardingManager({ children }: OnboardingManagerProps) {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = () => {
    try {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem('rivor-onboarding-completed');
      
      // Show walkthrough for new users
      if (!hasCompletedOnboarding) {
        setShowWalkthrough(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      // Default to showing walkthrough if localStorage is not available
      setShowWalkthrough(true);
    } finally {
      setLoading(false);
    }
  };

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false);
    
    // Mark onboarding as completed
    try {
      localStorage.setItem('rivor-onboarding-completed', 'true');
      localStorage.setItem('rivor-onboarding-completed-date', new Date().toISOString());
    } catch (error) {
      console.error('Failed to save onboarding completion:', error);
    }
  };

  const handleWalkthroughSkip = () => {
    setShowWalkthrough(false);
    
    // Mark as skipped but not completed
    try {
      localStorage.setItem('rivor-onboarding-completed', 'skipped');
      localStorage.setItem('rivor-onboarding-skipped-date', new Date().toISOString());
    } catch (error) {
      console.error('Failed to save onboarding skip:', error);
    }
  };

  // Don't render anything while loading
  if (loading) {
    return <div>{children}</div>;
  }

  return (
    <>
      {children}
      
      {showWalkthrough && (
        <SimpleOnboarding
          onComplete={handleWalkthroughComplete}
          onSkip={handleWalkthroughSkip}
        />
      )}
    </>
  );
}