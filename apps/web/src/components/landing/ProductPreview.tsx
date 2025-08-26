"use client";

import { motion } from 'framer-motion';
import { Mail, BarChart3, MessageSquare, Calendar, User, Star, ArrowRight, TrendingUp, Phone, Plus } from 'lucide-react';

export default function ProductPreview() {
  return (
    <div className="relative">
      {/* Glow effect using actual glass theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl" />
      
      {/* Main preview card with authentic glass styling */}
      <div className="relative glass-card shadow-2xl overflow-hidden">
        {/* Header with authentic glass styling */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <div className="w-3 h-3 bg-green-400 rounded-full" />
          </div>
          <div className="text-xs text-white/70">rivor.ai</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-4">
            {/* Sidebar with authentic dashboard styling */}
            <div className="col-span-3 space-y-2">
              <div className="text-xs font-medium text-white/80 uppercase tracking-wider mb-3">
                Dashboard
              </div>
              
              {[
                { icon: BarChart3, label: 'Overview', active: true },
                { icon: Mail, label: 'Inbox', active: false, badge: '12' },
                { icon: Phone, label: 'Contacts', active: false },
                { icon: Calendar, label: 'Calendar', active: false },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                    item.active 
                      ? 'glass-card bg-white/10 text-white border border-white/20' 
                      : 'text-white/70 hover:text-white hover:bg-white/5 rounded-xl'
                  }`}
                >
                  <item.icon className="h-3 w-3" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Main content - Dashboard Metrics */}
            <div className="col-span-9 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Dashboard Overview</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-white/70">Live data</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Active Leads',
                    value: '24',
                    change: '+12%',
                    positive: true,
                    icon: TrendingUp
                  },
                  {
                    label: 'Closed Deals',
                    value: '$2.4M',
                    change: '+8%',
                    positive: true,
                    icon: BarChart3
                  },
                  {
                    label: 'New Messages',
                    value: '47',
                    change: '+23%',
                    positive: true,
                    icon: Mail
                  },
                  {
                    label: 'Showings',
                    value: '12',
                    change: '+5%',
                    positive: true,
                    icon: Calendar
                  }
                ].map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + 0.1 * index }}
                    className="glass-card p-3 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="h-3 w-3 text-blue-400" />
                      <span className="text-[9px] text-white/70 uppercase tracking-wide">{metric.label}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-semibold text-white">{metric.value}</span>
                      <span className={`text-[9px] font-medium ${
                        metric.positive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="glass-card p-3">
                <div className="text-[10px] text-white/70 uppercase tracking-wide mb-2">Recent Activity</div>
                <div className="space-y-2">
                  {[
                    { action: 'New lead from Oak Street inquiry', time: '2m ago', type: 'lead' },
                    { action: 'Showing scheduled for downtown condo', time: '15m ago', type: 'event' },
                    { action: 'Contract signed - Wilson Property', time: '1h ago', type: 'deal' }
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px]">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'lead' ? 'bg-green-400' :
                        activity.type === 'event' ? 'bg-blue-400' : 'bg-purple-400'
                      }`} />
                      <span className="flex-1 text-white/90">{activity.action}</span>
                      <span className="text-white/50">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI insights panel with authentic styling */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="glass-card p-3 border border-cyan-500/30 bg-cyan-500/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Star className="h-2 w-2 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-cyan-400">AI Assistant</span>
                </div>
                <p className="text-[9px] text-white/90 leading-relaxed mb-2">
                  3 high-priority leads detected. Oak Street inquiry shows 95% conversion probability. 
                  Schedule showing within 48 hours for optimal results.
                </p>
                <button className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-white transition-colors">
                  Draft response <ArrowRight className="h-2 w-2" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}