"use client";

import { motion } from 'framer-motion';
import { Mail, BarChart3, MessageSquare, Calendar, User, Star, ArrowRight } from 'lucide-react';

export default function ProductPreview() {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1E5EFF]/20 via-[#16C4D9]/20 to-[#3AF6C3]/20 rounded-3xl blur-xl" />
      
      {/* Main preview card */}
      <div className="relative rounded-2xl border border-white/10 bg-[#121A28]/80 backdrop-blur-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <div className="w-3 h-3 bg-green-400 rounded-full" />
          </div>
          <div className="text-xs text-[#6E85AC]">rivor.ai</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-4">
            {/* Sidebar */}
            <div className="col-span-3 space-y-3">
              <div className="text-xs font-medium text-[#9CB3D9] uppercase tracking-wider mb-2">
                Workspace
              </div>
              
              {[
                { icon: Mail, label: 'Inbox', active: true, badge: '3' },
                { icon: BarChart3, label: 'Pipeline', active: false },
                { icon: MessageSquare, label: 'Assistant', active: false },
                { icon: Calendar, label: 'Calendar', active: false },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                    item.active 
                      ? 'bg-gradient-to-r from-[#1E5EFF]/20 to-[#16C4D9]/20 text-[#EAF2FF] border-l-2 border-[#1E5EFF]' 
                      : 'text-[#6E85AC] hover:text-[#9CB3D9]'
                  }`}
                >
                  <item.icon className="h-3 w-3" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Main content */}
            <div className="col-span-9 space-y-3">
              {/* Email list header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#EAF2FF]">Inbox</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-[#6E85AC]">AI active</span>
                </div>
              </div>

              {/* Email items */}
              {[
                {
                  name: 'Sarah Johnson',
                  subject: 'Interested in Oak Street property',
                  time: '2m ago',
                  score: 95,
                  intent: 'Buyer',
                  unread: true
                },
                {
                  name: 'Mike Chen',
                  subject: 'Schedule showing for downtown condo',
                  time: '15m ago', 
                  score: 87,
                  intent: 'Showing',
                  unread: true
                },
                {
                  name: 'Lisa Rodriguez',
                  subject: 'Market analysis request',
                  time: '1h ago',
                  score: 72,
                  intent: 'Info',
                  unread: false
                }
              ].map((email, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + 0.1 * index }}
                  className={`p-3 rounded-lg border transition-all hover:bg-white/5 ${
                    email.unread 
                      ? 'border-[#1E5EFF]/30 bg-[#1E5EFF]/5' 
                      : 'border-white/5 bg-white/2'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#1E5EFF] to-[#16C4D9] rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <div className={`text-xs font-medium ${email.unread ? 'text-[#EAF2FF]' : 'text-[#9CB3D9]'}`}>
                          {email.name}
                        </div>
                        <div className="text-[10px] text-[#6E85AC]">{email.time}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <div className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        email.score >= 90 ? 'bg-green-500/20 text-green-400' :
                        email.score >= 80 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {email.score}%
                      </div>
                      <div className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-[#9CB3D9]">
                        {email.intent}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`text-[10px] mb-2 ${email.unread ? 'text-[#9CB3D9]' : 'text-[#6E85AC]'}`}>
                    {email.subject}
                  </div>
                  
                  {/* AI suggestions */}
                  {email.unread && (
                    <div className="flex gap-1">
                      <button className="px-2 py-1 bg-gradient-to-r from-[#1E5EFF] to-[#16C4D9] text-white text-[9px] rounded font-medium hover:opacity-90 transition-opacity">
                        Draft Reply
                      </button>
                      <button className="px-2 py-1 bg-white/10 text-[#9CB3D9] text-[9px] rounded hover:bg-white/20 transition-colors">
                        Schedule
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* AI insights panel */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-4 p-3 rounded-lg border border-[#3AF6C3]/30 bg-[#3AF6C3]/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-[#16C4D9] to-[#3AF6C3] rounded flex items-center justify-center">
                    <Star className="h-2 w-2 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-[#3AF6C3]">AI Insight</span>
                </div>
                <p className="text-[9px] text-[#9CB3D9] leading-relaxed">
                  Sarah is a high-intent buyer. Suggest Oak Street showing this week. 
                  Market comp data attached.
                </p>
                <button className="flex items-center gap-1 mt-2 text-[9px] text-[#3AF6C3] hover:text-[#EAF2FF] transition-colors">
                  Take action <ArrowRight className="h-2 w-2" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}