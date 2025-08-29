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
  Sparkles,
  Palette,
  Sun,
  Moon
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
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileCompletionStatus | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'black'>(theme === 'black' ? 'black' : 'light');
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [emailSignature, setEmailSignature] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const steps = [
    {
      id: 'theme',
      title: 'Choose Your Experience',
      description: 'Select the theme that matches your style',
      icon: <Palette className="h-6 w-6" />,
      field: 'theme'
    },
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
        case 'theme':
          // Theme is handled directly, no API call needed
          return true;
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
      case 'theme':
        value = selectedTheme;
        // Apply theme immediately
        setTheme(selectedTheme);
        break;
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
      } relative overflow-hidden`}>
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute w-64 h-64 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
              top: '20%',
              left: '10%'
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-48 h-48 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)',
              bottom: '20%',
              right: '10%'
            }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div 
          className="text-center glass-card p-12 relative z-10"
          style={{
            backdropFilter: 'blur(20px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
            background: theme === 'black' 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Enhanced Loading Spinner */}
          <motion.div 
            className="relative w-16 h-16 mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 border-r-purple-500"></div>
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-transparent border-b-pink-500 border-l-blue-500"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-4 w-4 h-4 bg-gradient-to-br from-teal-500 to-purple-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          
          <motion.p 
            className="text-lg font-medium"
            style={{ color: 'var(--glass-text-muted)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Preparing your experience...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`min-h-screen ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'} relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 100%)'
          }}
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          initial={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(6, 182, 212, 0.2) 50%, transparent 100%)'
          }}
          animate={{
            x: [100, -100, 100],
            y: [50, -50, 50],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          initial={{ top: '60%', right: '10%' }}
        />
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <motion.div 
            className="relative p-6 rounded-full text-white w-20 h-20 mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.8), rgba(147, 51, 234, 0.8))',
              backdropFilter: 'blur(20px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 8px 32px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                '0 12px 48px rgba(147, 51, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                '0 8px 32px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          >
            <Sparkles className="h-8 w-8" />
            
            {/* Floating particles around the icon */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                style={{
                  top: '50%',
                  left: '50%'
                }}
                animate={{
                  x: [0, Math.cos(i * Math.PI / 3) * 40],
                  y: [0, Math.sin(i * Math.PI / 3) * 40],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold mb-3"
            style={{ 
              color: 'var(--glass-text)',
              textShadow: theme === 'black' ? '0 0 20px rgba(6, 182, 212, 0.3)' : 'none'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Welcome to Rivor
          </motion.h1>
          <motion.p 
            className="text-xl"
            style={{ color: 'var(--glass-text-muted)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Let's personalize your experience
          </motion.p>
          
          {/* Enhanced Progress */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                {Math.round(progress)}%
              </span>
            </div>
            
            {/* Custom Liquid Glass Progress Bar */}
            <div className="relative h-3 rounded-full overflow-hidden"
                 style={{
                   background: 'rgba(255, 255, 255, 0.1)',
                   backdropFilter: 'blur(10px)',
                   WebkitBackdropFilter: 'blur(10px)',
                   border: '1px solid rgba(255, 255, 255, 0.2)'
                 }}>
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.8), rgba(147, 51, 234, 0.8))',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Animated shine effect */}
                <motion.div
                  className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            </div>
            
            {/* Step indicators */}
            <div className="flex justify-between mt-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    index <= currentStep
                      ? 'bg-gradient-to-br from-teal-500 to-purple-500 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-white/10 border border-white/20 text-gray-500'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Current Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="glass-card relative overflow-hidden"
              style={{
                backdropFilter: 'blur(20px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                background: theme === 'black' 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {/* Animated border gradient */}
              <motion.div
                className="absolute inset-0 rounded-lg opacity-50"
                style={{
                  background: 'linear-gradient(45deg, rgba(6, 182, 212, 0.1) 0%, transparent 25%, rgba(147, 51, 234, 0.1) 50%, transparent 75%, rgba(6, 182, 212, 0.1) 100%)',
                  backgroundSize: '200% 200%'
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />

              <CardHeader className="text-center relative z-10">
                <motion.div 
                  className="p-4 rounded-full text-white w-20 h-20 mx-auto mb-6 relative"
                  style={{
                    background: `linear-gradient(135deg, ${
                      currentStepData.field === 'theme' ? 'rgba(255, 107, 114, 0.8), rgba(255, 142, 83, 0.8)' :
                      currentStepData.field === 'name' ? 'rgba(6, 182, 212, 0.8), rgba(59, 130, 246, 0.8)' :
                      currentStepData.field === 'image' ? 'rgba(34, 197, 94, 0.8), rgba(22, 163, 74, 0.8)' :
                      currentStepData.field === 'emailSignature' ? 'rgba(147, 51, 234, 0.8), rgba(168, 85, 247, 0.8)' :
                      'rgba(249, 115, 22, 0.8), rgba(251, 146, 60, 0.8)'
                    })`,
                    backdropFilter: 'blur(20px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentStepData.icon}
                  
                  {/* Glowing ring effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/20"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <CardTitle className="text-2xl font-bold mb-3" style={{ color: 'var(--glass-text)' }}>
                    {currentStepData.title}
                  </CardTitle>
                  <p className="text-lg" style={{ color: 'var(--glass-text-muted)' }}>
                    {currentStepData.description}
                  </p>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Theme Selection Step */}
                {currentStepData.field === 'theme' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Light Theme Option */}
                      <motion.div
                        className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                          selectedTheme === 'light' 
                            ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/25' 
                            : 'hover:scale-[1.02] hover:shadow-md'
                        }`}
                        onClick={() => setSelectedTheme('light')}
                        whileHover={{ scale: selectedTheme === 'light' ? 1 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="aspect-video bg-gradient-to-br from-white via-gray-50 to-blue-50 p-6 border border-gray-200">
                          {/* Mock UI Preview */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded opacity-80"></div>
                              </div>
                              <div className="flex-1 h-2 bg-gray-300 rounded"></div>
                              <Sun className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div className="space-y-2">
                              <div className="h-1.5 bg-gray-400 rounded w-3/4"></div>
                              <div className="h-1.5 bg-gray-300 rounded w-1/2"></div>
                              <div className="h-1.5 bg-gray-300 rounded w-2/3"></div>
                            </div>
                            <div className="flex gap-1">
                              <div className="w-12 h-6 bg-blue-200 rounded"></div>
                              <div className="w-12 h-6 bg-purple-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 text-center bg-white/80 backdrop-blur-sm">
                          <h3 className="font-semibold text-gray-900 mb-1">Light Mode</h3>
                          <p className="text-sm text-gray-600">Clean and bright interface</p>
                          {selectedTheme === 'light' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                            >
                              <CheckCircle className="h-4 w-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {/* Dark Theme Option */}
                      <motion.div
                        className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                          selectedTheme === 'black' 
                            ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/25' 
                            : 'hover:scale-[1.02] hover:shadow-md'
                        }`}
                        onClick={() => setSelectedTheme('black')}
                        whileHover={{ scale: selectedTheme === 'black' ? 1 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="aspect-video bg-gradient-to-br from-gray-900 via-black to-purple-900 p-6 border border-gray-700">
                          {/* Mock UI Preview */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded opacity-90"></div>
                              </div>
                              <div className="flex-1 h-2 bg-gray-600 rounded"></div>
                              <Moon className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="space-y-2">
                              <div className="h-1.5 bg-gray-300 rounded w-3/4"></div>
                              <div className="h-1.5 bg-gray-400 rounded w-1/2"></div>
                              <div className="h-1.5 bg-gray-400 rounded w-2/3"></div>
                            </div>
                            <div className="flex gap-1">
                              <div className="w-12 h-6 bg-purple-400/30 rounded"></div>
                              <div className="w-12 h-6 bg-pink-400/30 rounded"></div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 text-center bg-black/80 backdrop-blur-sm">
                          <h3 className="font-semibold text-white mb-1">Dark Mode</h3>
                          <p className="text-sm text-gray-300">Elegant and focused experience</p>
                          {selectedTheme === 'black' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                            >
                              <CheckCircle className="h-4 w-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                        Don't worry, you can always change this later in settings
                      </p>
                    </div>
                  </div>
                )}

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
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}