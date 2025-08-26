"use client";

import { motion } from 'framer-motion';
import { Mail, Zap, BarChart3 } from 'lucide-react';

export default function WhyRivorSection() {
  const features = [
    {
      icon: Mail,
      title: 'AI Inbox Triage',
      description: 'See the real leads first with automatic scoring and intent detection.'
    },
    {
      icon: Zap,
      title: 'One-click Actions',
      description: 'Draft replies, schedule showings, and create tasks in seconds.'
    },
    {
      icon: BarChart3,
      title: 'Pipeline in Motion',
      description: 'Drag deals forward and watch insights update live.'
    }
  ];

  return (
    <section id="why-rivor" className="py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
            Why agents will love it
          </h2>
          <p className="text-base md:text-lg text-[#9CB3D9] max-w-2xl mx-auto">
            Built specifically for real estate professionals who want to spend less time 
            managing emails and more time closing deals.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 h-full transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl">
                {/* Icon */}
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{
                    background: 'rgba(30, 94, 255, 0.15)',
                    backdropFilter: 'blur(20px) saturate(1.3)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
                    border: '1px solid rgba(30, 94, 255, 0.2)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 20px rgba(30, 94, 255, 0.15)'
                  }}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-4 text-[#EAF2FF] group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[#9CB3D9] leading-relaxed group-hover:text-[#B8C5E0] transition-colors">
                  {feature.description}
                </p>

                {/* Hover indicator */}
                <div className="mt-6 flex items-center text-[#6E85AC] group-hover:text-[#16C4D9] transition-colors">
                  <span className="text-sm font-medium">Learn more</span>
                  <motion.div
                    className="ml-2 w-4 h-4"
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    →
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}