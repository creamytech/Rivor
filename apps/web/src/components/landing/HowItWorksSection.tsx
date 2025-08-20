"use client";

import { motion } from 'framer-motion';
import { Mail, Calendar, Zap, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      icon: Mail,
      title: 'Connect',
      description: 'Gmail/Outlook + Calendar',
      detail: 'Securely connect your email and calendar with OAuth. Rivor only accesses what you allow.'
    },
    {
      number: '02', 
      icon: Zap,
      title: 'Analyze',
      description: 'AI summarizes intent, lead score, next best action',
      detail: 'Our AI reads between the lines to identify real opportunities and surface actionable insights.'
    },
    {
      number: '03',
      icon: ArrowRight,
      title: 'Act',
      description: 'Reply, schedule, or move the deal—without leaving the page',
      detail: 'Take action directly from your inbox. Draft responses, book showings, or update your pipeline.'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24">
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
            How it works
          </h2>
          <p className="text-base md:text-lg text-[#9CB3D9] max-w-2xl mx-auto">
            Get up and running in minutes. No complex setup, no data migration required.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-[2px] -ml-6 z-0">
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1E5EFF]/30 to-[#16C4D9]/30" />
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#1E5EFF] to-[#16C4D9]"
                      initial={{ width: '0%' }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: index * 0.3 + 0.5 }}
                    />
                  </div>
                </div>
              )}

              <div className="relative z-10 text-center">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#1E5EFF] via-[#16C4D9] to-[#3AF6C3] mb-6">
                  <span className="text-lg font-bold text-white">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <step.icon className="h-8 w-8 text-[#16C4D9] mx-auto" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2 text-[#EAF2FF]">
                  {step.title}
                </h3>
                <p className="text-[#9CB3D9] mb-4 font-medium">
                  {step.description}
                </p>
                <p className="text-sm text-[#6E85AC] leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* River progress animation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 relative"
        >
          <div className="h-1 bg-gradient-to-r from-transparent via-[#1E5EFF]/20 via-[#16C4D9]/20 to-transparent rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#1E5EFF] via-[#16C4D9] to-[#3AF6C3]"
              initial={{ width: '0%', x: '-100%' }}
              whileInView={{ width: '100%', x: '0%' }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 1.2 }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}