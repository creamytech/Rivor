"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  Sparkles,
  MessageCircle,
  Brain,
  CheckCircle,
  Clock,
  User,
  Mic,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface PersonalityOnboardingProps {
  onComplete?: () => void;
  className?: string;
}

export function PersonalityOnboarding({ onComplete, className }: PersonalityOnboardingProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [completed, setCompleted] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startOnboarding = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/assistant/personality/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setMessages([{
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        }]);
        setProgress(data.progress);
        setCurrentStep(data.step);
      }
    } catch (error) {
      console.error('Failed to start onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    // Add user message immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await fetch('/api/assistant/personality/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        }]);
        
        setProgress(data.progress);
        setCurrentStep(data.step);
        
        if (data.completed) {
          setCompleted(true);
          setAnalyzing(true);
          
          // Simulate analysis time
          setTimeout(() => {
            setAnalyzing(false);
            onComplete?.();
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStepInfo = (step: string) => {
    const steps = {
      greeting: { title: 'Greeting Style', icon: MessageCircle },
      follow_up_style: { title: 'Follow-up Approach', icon: Clock },
      objection_handling: { title: 'Objection Handling', icon: Brain },
      appointment_setting: { title: 'Appointment Setting', icon: Calendar },
      personal_brand: { title: 'Personal Brand', icon: Sparkles },
      completion: { title: 'Style Analysis', icon: CheckCircle }
    };
    return steps[step as keyof typeof steps] || { title: 'Getting Started', icon: Bot };
  };

  if (!sessionId && !completed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("max-w-2xl mx-auto", className)}
      >
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <Bot className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              🎯 AI Personality Training
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Let me learn your unique communication style so I can write emails, follow-ups, and messages that sound exactly like you.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50">
                <MessageCircle className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <div className="font-semibold text-blue-700">Natural Conversation</div>
                  <div className="text-sm text-blue-600">
                    Just respond naturally to scenarios - no special formatting needed
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50">
                <Clock className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <div className="font-semibold text-green-700">Quick & Easy</div>
                  <div className="text-sm text-green-600">
                    Takes just 3-4 minutes to complete the entire process
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="font-semibold text-purple-700">What I'll Learn About You:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-purple-600">
                <div>• Your greeting style</div>
                <div>• Follow-up approach</div>
                <div>• Objection handling</div>
                <div>• Appointment setting</div>
                <div>• Personal brand voice</div>
                <div>• Signature phrases</div>
              </div>
            </div>

            <Button 
              onClick={startOnboarding} 
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start AI Training
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (analyzing || completed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("max-w-2xl mx-auto", className)}
      >
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: analyzing ? 360 : 0 }}
                transition={{ duration: 2, repeat: analyzing ? Infinity : 0 }}
                className="mx-auto mb-4"
              >
                <Brain className={cn(
                  "h-16 w-16 mx-auto",
                  analyzing ? "text-purple-500" : "text-green-500"
                )} />
              </motion.div>
              
              {analyzing ? (
                <>
                  <h3 className="text-xl font-bold mb-2">🧠 Analyzing Your Style...</h3>
                  <p className="text-gray-600 mb-4">
                    I'm processing your responses to understand your unique communication patterns.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
                    <div className="animate-pulse">Extracting tone preferences</div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <div className="animate-pulse delay-100">Learning vocabulary patterns</div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <div className="animate-pulse delay-200">Building personality model</div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2 text-green-700">
                    ✅ Training Complete!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    I've successfully learned your communication style. All future AI-generated emails and messages will now sound authentically like you!
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500 mb-1" />
                      <div className="font-semibold text-green-700">Style Learned</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500 mb-1" />
                      <div className="font-semibold text-green-700">Voice Captured</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const stepInfo = getStepInfo(currentStep);
  const StepIcon = stepInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("max-w-3xl mx-auto", className)}
    >
      <Card className="glass-card h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StepIcon className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">{stepInfo.title}</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {progress}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === 'assistant' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-blue-100 text-blue-600'
                  )}>
                    {message.role === 'assistant' ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-lg text-sm",
                    message.role === 'assistant'
                      ? 'bg-purple-50 text-purple-900 rounded-bl-sm'
                      : 'bg-blue-50 text-blue-900 rounded-br-sm'
                  )}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-purple-50 p-3 rounded-lg rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response naturally..."
              className="flex-1 resize-none min-h-[80px] max-h-[120px]"
              disabled={isLoading || completed}
            />
            <Button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isLoading || completed}
              size="sm"
              className="px-3 self-end mb-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}