"use client";

import React from 'react';
import AppShell from "@/components/app/AppShell";
import { useTheme } from "@/contexts/ThemeContext";
import { AssistantDashboard } from "@/components/assistant/AssistantDashboard";
import { Bot, Sparkles, Zap } from 'lucide-react';

export default function AssistantPage() {
  const { theme } = useTheme();

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        {/* Header */}
        <div className="px-4 mt-4 mb-6 main-content-area">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--glass-text)' }}>
                    AI Assistant Hub
                  </h1>
                  <p style={{ color: 'var(--glass-text-secondary)' }}>
                    Your AI-powered real estate assistant - Never miss a lead, appointment, or follow-up again
                  </p>
                </div>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-300/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">
                    Active & Running
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="glass-card p-4">
                <div className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
                  📅 Smart Scheduling
                </div>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  Automatic appointment scheduling with conflict resolution and reminders
                </p>
              </div>
              <div className="glass-card p-4">
                <div className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
                  🎯 Lead Qualification
                </div>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  AI-powered lead scoring and qualification with smart nurturing sequences
                </p>
              </div>
              <div className="glass-card p-4">
                <div className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
                  🤖 Auto Follow-ups
                </div>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  Personalized follow-up sequences that adapt based on lead behavior
                </p>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-300/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-700">
                  Assistant Replacement Value
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className="font-semibold text-green-600">$4,800/month</div>
                  <div className="text-gray-600">Cost Savings</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600">24/7</div>
                  <div className="text-gray-600">Availability</div>
                </div>
                <div>
                  <div className="font-semibold text-purple-600">95%</div>
                  <div className="text-gray-600">Accuracy</div>
                </div>
                <div>
                  <div className="font-semibold text-orange-600">0 sec</div>
                  <div className="text-gray-600">Response Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-4 main-content-area">
          <AssistantDashboard />
        </div>
      </AppShell>
    </div>
  );
}