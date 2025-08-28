"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PersonalityOnboarding } from "@/components/assistant/PersonalityOnboarding";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [onboardingStatus, setOnboardingStatus] = useState<'loading' | 'required' | 'completed'>('loading');

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (status === 'loading') return;
      
      if (!session?.user?.email) {
        router.push('/auth/signin');
        return;
      }

      try {
        const response = await fetch('/api/user/onboarding-status');
        const data = await response.json();
        
        if (data.personalityOnboarded) {
          setOnboardingStatus('completed');
        } else {
          setOnboardingStatus('required');
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // Default to requiring onboarding on error
        setOnboardingStatus('required');
      }
    };

    checkOnboardingStatus();
  }, [session, status, router]);

  // Show loading while checking status
  if (status === 'loading' || onboardingStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show onboarding if required
  if (onboardingStatus === 'required') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 pt-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🤖 Welcome to Your AI Assistant
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Let's personalize your AI assistant to match your communication style
            </p>
            <p className="text-gray-500">
              This quick 5-minute setup will help your AI write emails that sound exactly like you
            </p>
          </div>
          
          <PersonalityOnboarding 
            onComplete={async () => {
              // Mark onboarding as complete
              try {
                await fetch('/api/user/complete-onboarding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                setOnboardingStatus('completed');
              } catch (error) {
                console.error('Failed to complete onboarding:', error);
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Show the protected content
  return <>{children}</>;
}