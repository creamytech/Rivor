"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Users, Zap } from 'lucide-react';

interface FinalCTASectionProps {
  onWaitlistClick: () => void;
}

export default function FinalCTASection({ onWaitlistClick }: FinalCTASectionProps) {
  const stats = [
    {
      icon: Users,
      value: '1,000+',
      label: 'Agents on waitlist'
    },
    {
      icon: Star,
      value: '95%',
      label: 'Lead accuracy rate'
    },
    {
      icon: Zap,
      value: '3x',
      label: 'Faster response time'
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E5EFF]/10 via-[#16C4D9]/10 to-[#3AF6C3]/10 rounded-3xl blur-xl" />
          
          {/* Content */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 md:p-12 text-center">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-[#1E5EFF]/10 border border-[#1E5EFF]/20 rounded-full px-4 py-2 mb-6">
                <div className="w-2 h-2 bg-[#1E5EFF] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[#1E5EFF]">Limited Beta Access</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
                Ready to close more deals with{' '}
                <span className="bg-gradient-to-r from-[#1E5EFF] via-[#16C4D9] to-[#3AF6C3] bg-clip-text text-transparent">
                  AI-powered
                </span>{' '}
                insights?
              </h2>
              
              <p className="text-lg text-[#9CB3D9] max-w-2xl mx-auto">
                Join the beta and be among the first agents to experience the future of 
                real estate email management.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid md:grid-cols-3 gap-8 mb-12"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-[#1E5EFF]/20 to-[#16C4D9]/20 border border-white/10 mb-4">
                    <stat.icon className="h-6 w-6 text-[#16C4D9]" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-[#EAF2FF] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[#9CB3D9]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              <Button
                onClick={onWaitlistClick}
                size="lg"
                className="rounded-xl px-8 py-4 font-medium text-slate-900 bg-gradient-to-r from-[#1E5EFF] via-[#16C4D9] to-[#3AF6C3] hover:opacity-95 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#0E1420] transition-all text-lg group"
              >
                Join the Beta Waitlist
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="flex items-center justify-center gap-4 text-sm text-[#6E85AC]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-green-400 bg-green-400/20 flex items-center justify-center">
                    <div className="w-2 h-1 bg-green-400 rotate-45 origin-left transform" />
                    <div className="w-1 h-2 bg-green-400 -ml-0.5" />
                  </div>
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-green-400 bg-green-400/20 flex items-center justify-center">
                    <div className="w-2 h-1 bg-green-400 rotate-45 origin-left transform" />
                    <div className="w-1 h-2 bg-green-400 -ml-0.5" />
                  </div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-green-400 bg-green-400/20 flex items-center justify-center">
                    <div className="w-2 h-1 bg-green-400 rotate-45 origin-left transform" />
                    <div className="w-1 h-2 bg-green-400 -ml-0.5" />
                  </div>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}