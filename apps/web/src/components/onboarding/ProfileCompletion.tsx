"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Camera, 
  Mail, 
  Bot, 
  CheckCircle, 
  ArrowRight,
  Upload,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

interface ProfileCompletionProps {
  onComplete?: () => void;
}

export default function ProfileCompletion({ onComplete }: ProfileCompletionProps) {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileCompletionStatus | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [emailSignature, setEmailSignature] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const steps = [
    {
      id: 'name',
      title: 'Complete Your Profile',
      description: 'Let\'s get your full name for professional communications',
      icon: <User className="h-6 w-6" />,
      field: 'name'
    },
    {
      id: 'image',
      title: 'Add Profile Picture',
      description: 'Upload a professional photo for your email signature',
      icon: <Camera className="h-6 w-6" />,
      field: 'image'
    },
    {
      id: 'emailSignature',
      title: 'Create Email Signature',
      description: 'Set up your professional email signature',
      icon: <Mail className="h-6 w-6" />,
      field: 'emailSignature'
    },
    {
      id: 'personalityOnboarding',
      title: 'AI Assistant Setup',
      description: 'Complete your AI personality preferences',
      icon: <Bot className="h-6 w-6" />,
      field: 'personalityOnboarding'
    }
  ];

  // Check profile completion status
  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const response = await fetch('/api/profile/completion');
        if (response.ok) {
          const status: ProfileCompletionStatus = await response.json();
          setProfileStatus(status);
          
          // Find the first missing field and set as current step
          if (!status.isComplete && status.missingFields.length > 0) {
            const firstMissingField = status.missingFields[0];
            const stepIndex = steps.findIndex(step => step.field === firstMissingField);
            setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
          }
        }
      } catch (error) {
        console.error('Failed to check profile completion:', error);
      } finally {
        setLoading(false);
      }
    };

    checkProfileCompletion();
  }, []);

  // Load existing user data
  useEffect(() => {
    if (session?.user) {
      setFullName(session.user.name || '');
      setProfileImage(session.user.image || '');
    }
  }, [session]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveStep = async (stepField: string, value: any) => {
    try {
      setSaving(true);
      
      let endpoint = '';
      let body: any = {};

      switch (stepField) {
        case 'name':
          endpoint = '/api/profile/update';
          body = { name: value };
          break;
        case 'image':
          if (imageFile) {
            // In a real app, you'd upload to a cloud service
            // For now, we'll use a placeholder
            endpoint = '/api/profile/update';
            body = { image: profileImage };
          }
          break;
        case 'emailSignature':
          endpoint = '/api/profile/signature';
          body = { signature: value };
          break;
        case 'personalityOnboarding':
          endpoint = '/api/profile/update';
          body = { personalityOnboarded: true };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({
          title: 'Saved!',
          description: 'Your profile has been updated.'
        });
        return true;
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const currentStepData = steps[currentStep];
    let value: any;

    switch (currentStepData.field) {
      case 'name':
        value = fullName;
        if (!value.trim()) {
          toast({
            title: 'Required Field',
            description: 'Please enter your full name.',
            variant: 'destructive'
          });
          return;
        }
        break;
      case 'image':
        value = profileImage;
        if (!value) {
          toast({
            title: 'Required Field',
            description: 'Please upload a profile picture.',
            variant: 'destructive'
          });
          return;
        }
        break;
      case 'emailSignature':
        value = emailSignature;
        if (!value.trim()) {
          toast({
            title: 'Required Field',
            description: 'Please create an email signature.',
            variant: 'destructive'
          });
          return;
        }
        break;
      case 'personalityOnboarding':
        // This would typically redirect to a personality setup flow
        value = true;
        break;
    }

    const success = await saveStep(currentStepData.field, value);
    if (success) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Profile completion finished
        onComplete?.();
        router.push('/app');
      }
    }
  };

  const handleSkipToPersonality = () => {
    setCurrentStep(steps.findIndex(step => step.field === 'personalityOnboarding'));
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'
      }`}>
        <div className="text-center glass-card p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--glass-text-muted)' }}>Checking profile...</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`min-h-screen ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white w-16 h-16 mx-auto mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-8 w-8" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--glass-text)' }}>
            Complete Your Profile
          </h1>
          <p className="text-lg" style={{ color: 'var(--glass-text-muted)' }}>
            Let's set up your account for the best experience
          </p>
          
          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Current Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card">
              <CardHeader className="text-center">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white w-16 h-16 mx-auto mb-4">
                  {currentStepData.icon}
                </div>
                <CardTitle className="text-xl" style={{ color: 'var(--glass-text)' }}>
                  {currentStepData.title}
                </CardTitle>
                <p style={{ color: 'var(--glass-text-muted)' }}>
                  {currentStepData.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Name Step */}
                {currentStepData.field === 'name' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" style={{ color: 'var(--glass-text)' }}>
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {/* Image Step */}
                {currentStepData.field === 'image' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      {profileImage ? (
                        <div className="relative inline-block">
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white/20"
                          />
                          <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                            <Camera className="h-4 w-4 text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                          <User className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <Button variant="outline" className="relative">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Signature Step */}
                {currentStepData.field === 'emailSignature' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="emailSignature" style={{ color: 'var(--glass-text)' }}>
                        Email Signature *
                      </Label>
                      <Textarea
                        id="emailSignature"
                        value={emailSignature}
                        onChange={(e) => setEmailSignature(e.target.value)}
                        placeholder="Best regards,&#10;Your Name&#10;Your Title&#10;Your Company&#10;Phone: (555) 123-4567"
                        rows={6}
                        className="mt-2"
                      />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                      This signature will be used in your outgoing emails.
                    </p>
                  </div>
                )}

                {/* Personality Onboarding Step */}
                {currentStepData.field === 'personalityOnboarding' && (
                  <div className="text-center space-y-4">
                    <div className="p-6 rounded-lg glass-card">
                      <Bot className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--glass-text)' }}>
                        AI Assistant Ready!
                      </h3>
                      <p style={{ color: 'var(--glass-text-muted)' }}>
                        Your AI assistant is configured with default settings. You can customize your AI personality later in settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      disabled={saving}
                    >
                      Back
                    </Button>
                  )}
                  
                  <div className="flex items-center gap-2 ml-auto">
                    {currentStep < steps.length - 1 && (
                      <Button
                        variant="outline"
                        onClick={handleSkipToPersonality}
                        disabled={saving}
                      >
                        Skip to Dashboard
                      </Button>
                    )}
                    
                    <Button
                      variant="liquid"
                      onClick={handleNext}
                      disabled={saving}
                      className="min-w-[120px]"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : currentStep === steps.length - 1 ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {saving ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}