"use client";

import React from 'react';
import AppShell from "@/components/app/AppShell";
import { useTheme } from "@/contexts/ThemeContext";
import { IntelligenceDashboard } from "@/components/intelligence/IntelligenceDashboard";
import { Brain, Sparkles } from 'lucide-react';

export default function IntelligencePage() {
  const { theme } = useTheme();

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <AppShell>
        {/* Header */}
        <div className="px-4 mt-4 mb-6 main-content-area">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--glass-text)' }}>
                    Smart Lead Intelligence
                  </h1>
                  <p style={{ color: 'var(--glass-text-secondary)' }}>
                    AI-powered insights, predictions, and lead scoring
                  </p>
                </div>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-300/20">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">
                    AI Powered
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="glass-card p-4">
                <div className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
                  🎯 Lead Scoring
                </div>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  Advanced behavioral analysis and conversion probability predictions
                </p>
              </div>
              <div className="glass-card p-4">
                <div className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
                  🧠 Smart Insights
                </div>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  Real-time alerts for high-priority leads and urgent opportunities
                </p>
              </div>
              <div className="glass-card p-4">
                <div className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
                  📈 Predictions
                </div>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  Forecast lead behavior and optimize communication timing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-4 main-content-area">
          <IntelligenceDashboard />
        </div>
      </AppShell>
    </div>
  );
}