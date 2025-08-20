"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mail, BarChart3, MessageSquare, Star, ArrowRight, Calendar, User, Plus } from 'lucide-react';

interface FeaturePanelsProps {
  onWaitlistClick: () => void;
}

export default function FeaturePanels({ onWaitlistClick }: FeaturePanelsProps) {
  const features = [
    {
      id: 'ai-inbox',
      title: 'AI Inbox',
      subtitle: 'Never miss a lead again',
      description: 'Smart triage automatically surfaces high-intent buyers and sellers. See lead scores, intent analysis, and suggested actions at a glance.',
      cta: 'Draft with AI',
      visual: (
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-[#121A28]/80 backdrop-blur-sm p-6 space-y-4">
            {/* Email list */}
            {[
              { name: 'Sarah Chen', subject: 'Ready to buy - Oak Street', score: 95, intent: 'Hot Lead' },
              { name: 'Mike Johnson', subject: 'Property inquiry downtown', score: 87, intent: 'Buyer' },
              { name: 'Lisa Garcia', subject: 'Selling timeline question', score: 72, intent: 'Seller' }
            ].map((email, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#1E5EFF] to-[#16C4D9] rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#EAF2FF]">{email.name}</div>
                    <div className="text-xs text-[#9CB3D9]">{email.subject}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs ${
                    email.score >= 90 ? 'bg-green-500/20 text-green-400' :
                    email.score >= 80 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {email.score}%
                  </div>
                  <div className="px-2 py-1 rounded text-xs bg-white/10 text-[#9CB3D9]">
                    {email.intent}
                  </div>
                </div>
              </div>
            ))}
            
            {/* AI insight badge */}
            <div className="p-3 rounded-lg border border-[#3AF6C3]/30 bg-[#3AF6C3]/10">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-[#3AF6C3]" />
                <span className="text-xs font-medium text-[#3AF6C3]">AI Insight</span>
              </div>
              <p className="text-xs text-[#9CB3D9]">
                Sarah is highly motivated. Suggest Oak Street showing this week.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pipeline',
      title: 'Pipeline',
      subtitle: 'Visual deal flow that works',
      description: 'Drag and drop deals between stages. Real-time insights show you exactly where to focus your energy for maximum impact.',
      cta: 'Move stage',
      visual: (
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-[#121A28]/80 backdrop-blur-sm p-6">
            <div className="grid grid-cols-3 gap-4">
              {['Qualified', 'Showing', 'Offer'].map((stage, i) => (
                <div key={stage} className="space-y-3">
                  <div className="text-xs font-medium text-[#9CB3D9] mb-3">{stage}</div>
                  {i === 0 && (
                    <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                      <div className="text-xs font-medium text-[#EAF2FF] mb-1">Johnson Family</div>
                      <div className="text-xs text-[#9CB3D9] mb-2">$450K Budget</div>
                      <div className="text-xs text-blue-400">Ready to see homes</div>
                    </div>
                  )}
                  {i === 1 && (
                    <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                      <div className="text-xs font-medium text-[#EAF2FF] mb-1">Davis Purchase</div>
                      <div className="text-xs text-[#9CB3D9] mb-2">Oak Street</div>
                      <div className="text-xs text-green-400">Showing Thu 2pm</div>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                      <div className="text-xs font-medium text-[#EAF2FF] mb-1">Wilson Sale</div>
                      <div className="text-xs text-[#9CB3D9] mb-2">$520K List</div>
                      <div className="text-xs text-purple-400">Offer pending</div>
                    </div>
                  )}
                  {i === 0 && (
                    <div className="p-3 rounded-lg border border-dashed border-white/20 bg-white/5 flex items-center justify-center">
                      <Plus className="h-4 w-4 text-[#6E85AC]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'assistant',
      title: 'Assistant',
      subtitle: 'AI that knows real estate',
      description: 'Chat with an AI that understands your business. Get help drafting emails, market analysis, and next-step recommendations.',
      cta: 'Do it for me',
      visual: (
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-[#121A28]/80 backdrop-blur-sm p-6">
            <div className="space-y-4">
              {/* Chat messages */}
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-[#1E5EFF] to-[#16C4D9] text-white p-3 rounded-lg max-w-[80%]">
                    <div className="text-xs">Draft follow-up for Sarah about Oak Street showing</div>
                  </div>
                </div>
                
                <div className="flex justify-start">
                  <div className="bg-white/10 text-[#EAF2FF] p-3 rounded-lg max-w-[80%]">
                    <div className="text-xs mb-2">I'll draft a personalized follow-up for Sarah:</div>
                    <div className="text-xs text-[#9CB3D9] italic bg-white/5 p-2 rounded">
                      "Hi Sarah, Thanks for your interest in the Oak Street property. 
                      I have availability this Thursday or Friday for a showing. 
                      The home has the updated kitchen you mentioned..."
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-gradient-to-r from-[#1E5EFF] to-[#16C4D9] text-white text-xs rounded hover:opacity-90">
                  Send Email
                </button>
                <button className="px-3 py-1.5 bg-white/10 text-[#9CB3D9] text-xs rounded hover:bg-white/20">
                  Schedule Showing
                </button>
                <button className="px-3 py-1.5 bg-white/10 text-[#9CB3D9] text-xs rounded hover:bg-white/20">
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
              index < features.length - 1 ? 'mb-24 md:mb-32' : ''
            }`}
          >
            {/* Content */}
            <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
              <div className="mb-4">
                <span className="text-sm font-medium text-[#16C4D9] uppercase tracking-wider">
                  {feature.title}
                </span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-[#EAF2FF]">
                {feature.subtitle}
              </h3>
              
              <p className="text-lg text-[#9CB3D9] leading-relaxed mb-8">
                {feature.description}
              </p>
              
              <Button
                onClick={onWaitlistClick}
                className="rounded-xl px-6 py-3 font-medium text-slate-900 bg-gradient-to-r from-[#1E5EFF] via-[#16C4D9] to-[#3AF6C3] hover:opacity-95 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#0E1420] transition-all group"
              >
                Join the Waitlist
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Visual */}
            <div className={`${index % 2 === 1 ? 'lg:order-1' : ''} relative`}>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1E5EFF]/10 via-[#16C4D9]/10 to-[#3AF6C3]/10 rounded-3xl blur-xl" />
              
              {/* Content */}
              <div className="relative">
                {feature.visual}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}