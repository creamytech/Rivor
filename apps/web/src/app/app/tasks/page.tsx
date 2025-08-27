"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppShell from "@/components/app/AppShell";
import TasksList from "@/components/tasks/TasksList";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import { useTheme } from "@/contexts/ThemeContext";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckSquare, 
  Plus, 
  Lightbulb,
  Users,
  Mail,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  ArrowRight,
  Zap
} from 'lucide-react';
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

interface Suggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  data: any;
  category: string;
  urgency: 'high' | 'medium' | 'low';
}

export default function TasksPage() {
  const { theme } = useTheme();
  const { isMobile } = useMobileDetection();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [stats, setStats] = useState<any>({});

  // Fetch intelligent suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch('/api/integration/suggestions?context=tasks');
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setStats(data.stats || {});
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleSuggestionAction = async (suggestion: Suggestion) => {
    try {
      if (suggestion.action === 'create_task_from_email') {
        // Open create modal with pre-filled data
        setShowCreateModal(true);
      } else if (suggestion.action === 'create_calendar_event') {
        // Navigate to calendar with pre-filled data
        window.location.href = `/app/calendar?prefill=${encodeURIComponent(JSON.stringify(suggestion.data))}`;
      } else if (suggestion.action === 'create_task_for_contact') {
        // Open create modal with contact linking
        setShowCreateModal(true);
      }
    } catch (error) {
      console.error('Failed to execute suggestion:', error);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'email_follow_up': return Mail;
      case 'showing_request': return Calendar;
      case 'contact_outreach': return Users;
      case 'task_management': return CheckSquare;
      default: return Target;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <ToastProvider>
        <AppShell>
          <div className={`${isMobile ? 'px-4 py-4' : 'px-6 py-6'} main-content-area`}>
            <TokenErrorBanner />
            
            {/* Enhanced Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card glass-border-active mb-6"
            >
              <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'} mb-6`}>
                  <div className="flex items-center gap-4">
                    <div className="glass-icon-container">
                      <CheckSquare className="h-6 w-6" style={{ color: 'var(--glass-primary)' }} />
                    </div>
                    <div>
                      <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold glass-text-gradient`}>
                        Tasks & Actions
                      </h1>
                      <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                        Manage tasks with intelligent suggestions and cross-platform integration
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="liquid"
                    size={isMobile ? "default" : "lg"}
                    className={`glass-hover-glow ${isMobile ? 'w-full' : ''}`}
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    New Task
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass-card">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Suggestions</p>
                          <p className="text-lg font-semibold">{stats.total || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">High Priority</p>
                          <p className="text-lg font-semibold">{stats.high_urgency || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Email Follow-ups</p>
                          <p className="text-lg font-semibold">{stats.categories?.email_follow_up || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Contact Tasks</p>
                          <p className="text-lg font-semibold">{stats.categories?.contact_outreach || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>

            {/* Intelligent Suggestions Panel */}
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-card glass-border mb-6"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold">Smart Suggestions</h2>
                    <Badge variant="outline" className="ml-auto">
                      {suggestions.length} suggestions
                    </Badge>
                  </div>

                  <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                    {suggestions.slice(0, isMobile ? 3 : 6).map((suggestion, index) => {
                      const CategoryIcon = getCategoryIcon(suggestion.category);
                      return (
                        <Card key={index} className="glass-card border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <CategoryIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-sm truncate">{suggestion.title}</h3>
                                  <Badge 
                                    className={`text-xs ${getUrgencyColor(suggestion.urgency)} border`}
                                  >
                                    {suggestion.urgency}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                  {suggestion.description}
                                </p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleSuggestionAction(suggestion)}
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  Take Action
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {suggestions.length > (isMobile ? 3 : 6) && (
                    <div className="text-center mt-4">
                      <Button variant="ghost" size="sm">
                        View {suggestions.length - (isMobile ? 3 : 6)} more suggestions
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Enhanced Tasks List */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TasksList />
            </motion.div>
          </div>
        </AppShell>

        {/* Create Task Modal */}
        <CreateTaskModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onTaskCreated={(task) => {
            console.log('Task created:', task);
            setShowCreateModal(false);
          }}
        />
      </ToastProvider>
    </div>
  );
}