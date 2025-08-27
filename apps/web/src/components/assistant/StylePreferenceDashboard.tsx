"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Brain,
  TrendingUp,
  MessageSquare,
  Settings,
  BarChart3,
  Palette,
  Volume2,
  Gauge,
  Target,
  Users,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentPersonality {
  id: string;
  communicationStyle: string;
  tonePreferences: {
    warmth: number;
    professionalism: number;
    urgency: number;
    enthusiasm: number;
  };
  vocabularyPreferences: string[];
  writingPatterns: {
    averageSentenceLength: number;
    usesPersonalization: boolean;
    usesQuestions: boolean;
    usesExclamation: boolean;
    usesEmoji: boolean;
    directnessLevel: number;
    supportivenessLevel: number;
  };
  personalBrand: {
    uniqueValueProposition: string;
    specialties: string[];
    personalityTraits: string[];
  };
}

interface LearningTrends {
  trend: string;
  confidence: number;
  improvements: string[];
  trainingFrequency: number;
  totalSessions: number;
}

interface StylePreferenceDashboardProps {
  className?: string;
}

export function StylePreferenceDashboard({ className }: StylePreferenceDashboardProps) {
  const [personality, setPersonality] = useState<AgentPersonality | null>(null);
  const [trends, setTrends] = useState<LearningTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchPersonalityData();
  }, []);

  const fetchPersonalityData = async () => {
    try {
      setLoading(true);
      
      // Fetch personality data
      const personalityRes = await fetch('/api/assistant/personality/onboarding');
      const personalityData = await personalityRes.json();
      
      // Fetch learning trends
      const trendsRes = await fetch('/api/assistant/personality/analyze');
      const trendsData = await trendsRes.json();
      
      setPersonality(personalityData.personality);
      setTrends(trendsData.trends);
    } catch (error) {
      console.error('Error fetching personality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePersonalityField = (field: string, value: any) => {
    if (!personality) return;
    
    setPersonality(prev => ({
      ...prev!,
      [field]: value
    }));
    setUnsavedChanges(true);
  };

  const updateTonePreference = (tone: string, value: number) => {
    if (!personality) return;
    
    setPersonality(prev => ({
      ...prev!,
      tonePreferences: {
        ...prev!.tonePreferences,
        [tone]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const updateWritingPattern = (pattern: string, value: any) => {
    if (!personality) return;
    
    setPersonality(prev => ({
      ...prev!,
      writingPatterns: {
        ...prev!.writingPatterns,
        [pattern]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const saveChanges = async () => {
    if (!personality || !unsavedChanges) return;
    
    try {
      const response = await fetch('/api/assistant/personality/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personality)
      });
      
      if (response.ok) {
        setUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error saving personality changes:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!personality) {
    return (
      <Card className={cn("text-center py-12", className)}>
        <CardContent>
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No personality profile found</p>
          <Button onClick={fetchPersonalityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Style Preferences</h2>
          <p className="text-gray-600">Fine-tune how your AI assistant communicates</p>
        </div>
        
        {unsavedChanges && (
          <Button onClick={saveChanges} className="bg-purple-600 hover:bg-purple-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{trends?.confidence || 0}%</p>
                <p className="text-xs text-gray-500">AI Accuracy</p>
                <Badge variant={trends?.confidence && trends.confidence > 80 ? "default" : "secondary"} className="text-xs mt-1">
                  {trends?.trend || 'Learning'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{trends?.totalSessions || 0}</p>
                <p className="text-xs text-gray-500">Training Sessions</p>
                <p className="text-xs text-blue-600 mt-1">
                  {trends?.trainingFrequency || 0} active days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold capitalize">{personality.communicationStyle}</p>
                <p className="text-xs text-gray-500">Primary Style</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-green-600">Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{personality.vocabularyPreferences?.length || 0}</p>
                <p className="text-xs text-gray-500">Learned Phrases</p>
                <p className="text-xs text-orange-600 mt-1">
                  Vocabulary pattern
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'tone', label: 'Tone', icon: Volume2 },
          { id: 'patterns', label: 'Patterns', icon: BarChart3 },
          { id: 'brand', label: 'Brand', icon: Target }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Communication Style Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Warmth Level</div>
                      <Progress value={personality.tonePreferences.warmth * 10} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">
                        {personality.tonePreferences.warmth}/10
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Professionalism</div>
                      <Progress value={personality.tonePreferences.professionalism * 10} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">
                        {personality.tonePreferences.professionalism}/10
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-3">Recent Improvements</div>
                    <div className="space-y-2">
                      {trends?.improvements.map((improvement, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {improvement}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'tone' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Tone Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(personality.tonePreferences).map(([tone, value]) => (
                    <div key={tone}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium capitalize">{tone}</label>
                        <Badge variant="outline">{value}/10</Badge>
                      </div>
                      <Input
                        type="range"
                        value={value}
                        onChange={(e) => updateTonePreference(tone, parseInt(e.target.value))}
                        max={10}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {getToneDescription(tone, value)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'patterns' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Writing Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Uses Personalization</label>
                      <Switch
                        checked={personality.writingPatterns.usesPersonalization}
                        onCheckedChange={(checked) => updateWritingPattern('usesPersonalization', checked)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Uses Questions</label>
                      <Switch
                        checked={personality.writingPatterns.usesQuestions}
                        onCheckedChange={(checked) => updateWritingPattern('usesQuestions', checked)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Uses Exclamation</label>
                      <Switch
                        checked={personality.writingPatterns.usesExclamation}
                        onCheckedChange={(checked) => updateWritingPattern('usesExclamation', checked)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Uses Emoji</label>
                      <Switch
                        checked={personality.writingPatterns.usesEmoji}
                        onCheckedChange={(checked) => updateWritingPattern('usesEmoji', checked)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Average Sentence Length</label>
                    <Input
                      type="range"
                      value={personality.writingPatterns.averageSentenceLength}
                      onChange={(e) => updateWritingPattern('averageSentenceLength', parseInt(e.target.value))}
                      max={30}
                      min={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {personality.writingPatterns.averageSentenceLength} words per sentence
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'brand' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Personal Brand Voice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Value Proposition</label>
                    <Textarea
                      value={personality.personalBrand?.uniqueValueProposition || ''}
                      onChange={(e) => updatePersonalityField('personalBrand', {
                        ...personality.personalBrand,
                        uniqueValueProposition: e.target.value
                      })}
                      placeholder="What makes you unique as a real estate agent?"
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="h-3 w-3 mr-2" />
                Test AI Voice
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <RefreshCw className="h-3 w-3 mr-2" />
                Retrain Model
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="h-3 w-3 mr-2" />
                Advanced Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Common Phrases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {personality.vocabularyPreferences?.slice(0, 8).map((phrase, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {phrase}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getToneDescription(tone: string, value: number): string {
  const descriptions = {
    warmth: value > 7 ? 'Very warm and friendly' : value > 4 ? 'Balanced warmth' : 'More reserved',
    professionalism: value > 7 ? 'Highly formal' : value > 4 ? 'Professional but approachable' : 'Casual and relaxed',
    urgency: value > 7 ? 'Creates strong urgency' : value > 4 ? 'Moderate urgency when needed' : 'Calm and patient',
    enthusiasm: value > 7 ? 'Very enthusiastic' : value > 4 ? 'Appropriately enthusiastic' : 'More measured'
  };

  return descriptions[tone as keyof typeof descriptions] || 'Balanced approach';
}