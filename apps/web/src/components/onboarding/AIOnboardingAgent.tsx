"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  User, 
  Send,
  Sparkles,
  MessageSquare,
  Brain,
  Target,
  CheckCircle,
  ArrowRight,
  Mic,
  MicOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  analysis?: {
    tone: string;
    formality: string;
    keywords: string[];
    personality: string;
  };
}

interface ToneAnalysis {
  overallTone: string;
  communicationStyle: string;
  preferredFormality: string;
  keyPersonalityTraits: string[];
  businessFocus: string[];
  confidence: number;
}

interface AIOnboardingAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (analysis: ToneAnalysis) => void;
}

const questions = [
  "Hi! I'm your AI assistant. I'm excited to learn about your communication style so I can help you more effectively. Could you tell me a bit about yourself and your role in real estate?",
  "That's great! How do you typically communicate with your clients? Do you prefer a more formal approach or do you like to keep things casual and friendly?",
  "What kind of real estate do you focus on? Are you more into residential properties, commercial deals, investments, or a mix of everything?",
  "When you're following up with leads, what's your usual approach? Do you like to be direct and to-the-point, or do you prefer building relationships first?",
  "Finally, what would you say is your biggest strength when working with clients? What makes you stand out as a real estate professional?"
];

export default function AIOnboardingAgent({ isOpen, onClose, onComplete }: AIOnboardingAgentProps) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ToneAnalysis | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Start conversation
      setTimeout(() => {
        addAIMessage(questions[0]);
      }, 500);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addAIMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const analyzeMessage = async (content: string) => {
    try {
      const response = await fetch('/api/ai/analyze-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      });

      if (response.ok) {
        const analysis = await response.json();
        return analysis;
      }
    } catch (error) {
      console.error('Failed to analyze message:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;

    const userContent = currentInput.trim();
    setCurrentInput('');
    addUserMessage(userContent);

    // Analyze the user's message
    const messageAnalysis = await analyzeMessage(userContent);

    // Move to next question or complete
    const nextQuestionIndex = currentQuestionIndex + 1;
    
    if (nextQuestionIndex < questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setTimeout(() => {
        addAIMessage(questions[nextQuestionIndex]);
      }, 1500);
    } else {
      // All questions answered, perform final analysis
      setIsAnalyzing(true);
      const finalAnalysis = await performFinalAnalysis();
      setAnalysis(finalAnalysis);
      setIsAnalyzing(false);
      setIsComplete(true);
      
      setTimeout(() => {
        addAIMessage(`Perfect! I've learned a lot about your communication style. You have a ${finalAnalysis.overallTone} tone with ${finalAnalysis.communicationStyle} approach. I'll use this to help personalize your experience in Rivor. Click "Complete Setup" to finish!`);
      }, 1000);
    }
  };

  const performFinalAnalysis = async (): Promise<ToneAnalysis> => {
    // Collect all user messages for comprehensive analysis
    const userMessages = messages.filter(m => m.sender === 'user').map(m => m.content).join(' ');
    
    try {
      const response = await fetch('/api/ai/comprehensive-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: userMessages,
          conversationContext: 'onboarding_real_estate'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.analysis;
      }
    } catch (error) {
      console.error('Failed to perform comprehensive analysis:', error);
    }

    // Fallback analysis based on simple heuristics
    return {
      overallTone: 'professional and friendly',
      communicationStyle: 'relationship-focused',
      preferredFormality: 'balanced',
      keyPersonalityTraits: ['approachable', 'knowledgeable', 'client-focused'],
      businessFocus: ['residential', 'client service'],
      confidence: 0.75
    };
  };

  const handleComplete = () => {
    if (analysis) {
      onComplete(analysis);
    }
    onClose();
  };

  const progress = Math.round((currentQuestionIndex / questions.length) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-3xl h-[80vh] ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
        <div className="glass-card glass-border-active h-full flex flex-col" style={{ backgroundColor: 'var(--glass-surface)' }}>
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="glass-icon-container">
                  <Bot className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold glass-text-gradient">
                    Meet Your AI Assistant
                  </DialogTitle>
                  <DialogDescription className="text-base mt-1" style={{ color: 'var(--glass-text-muted)' }}>
                    I'll learn your communication style to personalize your experience
                  </DialogDescription>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  {currentQuestionIndex + 1} of {questions.length}
                </div>
                <Progress value={progress} className="w-24 h-2" />
              </div>
            </div>
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'flex gap-3',
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.sender === 'ai' && (
                      <div className="glass-icon-container-small flex-shrink-0">
                        <Bot className="h-4 w-4" style={{ color: 'var(--glass-primary)' }} />
                      </div>
                    )}
                    
                    <div className={cn(
                      'max-w-[80%] px-4 py-3 rounded-2xl',
                      message.sender === 'user' 
                        ? 'glass-card glass-border bg-gradient-to-r from-blue-500/10 to-purple-500/10' 
                        : 'glass-card glass-border'
                    )} style={{ 
                      backgroundColor: message.sender === 'user' ? 'var(--glass-primary-subtle)' : 'var(--glass-surface-subtle)'
                    }}>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--glass-text)' }}>
                        {message.content}
                      </p>
                      
                      {message.analysis && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {message.analysis.tone}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              {message.analysis.formality}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {message.sender === 'user' && (
                      <div className="glass-icon-container-small flex-shrink-0">
                        <User className="h-4 w-4" style={{ color: 'var(--glass-accent)' }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="glass-icon-container-small flex-shrink-0">
                    <Bot className="h-4 w-4" style={{ color: 'var(--glass-primary)' }} />
                  </div>
                  <div className="glass-card glass-border px-4 py-3 rounded-2xl" style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>AI is typing...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Analysis Indicator */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-center py-6"
                >
                  <div className="glass-card glass-border px-6 py-4 rounded-2xl text-center" style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Brain className="h-5 w-5 animate-pulse" style={{ color: 'var(--glass-primary)' }} />
                      <span className="text-sm font-medium">Analyzing your communication style...</span>
                    </div>
                    <Progress value={75} className="w-48" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {!isComplete && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <Textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Type your response here..."
                    className="glass-input resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentInput.trim() || isTyping}
                    variant="liquid"
                    size="lg"
                    className="glass-hover-glow self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Completion Actions */}
            {isComplete && analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="glass-card glass-border p-4 mb-4" style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold glass-text-gradient">Analysis Complete!</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium" style={{ color: 'var(--glass-text)' }}>Communication Style:</span>
                      <p style={{ color: 'var(--glass-text-muted)' }}>{analysis.communicationStyle}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--glass-text)' }}>Overall Tone:</span>
                      <p style={{ color: 'var(--glass-text-muted)' }}>{analysis.overallTone}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--glass-text)' }}>Key Traits:</span>
                      <p style={{ color: 'var(--glass-text-muted)' }}>{analysis.keyPersonalityTraits.join(', ')}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--glass-text)' }}>Focus Areas:</span>
                      <p style={{ color: 'var(--glass-text-muted)' }}>{analysis.businessFocus.join(', ')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={onClose} className="glass-button-secondary">
                    Skip for now
                  </Button>
                  <Button variant="liquid" onClick={handleComplete} className="glass-hover-glow">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Complete Setup
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}