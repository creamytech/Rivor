"use client";

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Server } from 'lucide-react';

export default function PrivacySection() {
  const privacyFeatures = [
    {
      icon: Shield,
      title: 'End-to-End Encryption',
      description: 'Your emails and data are encrypted in transit and at rest. Only you have the keys.'
    },
    {
      icon: Lock,
      title: 'Granular Permissions',
      description: 'Choose exactly what Rivor can access. Revoke permissions anytime.'
    },
    {
      icon: Eye,
      title: 'Transparent Processing',
      description: 'See exactly what data is analyzed and how insights are generated.'
    },
    {
      icon: Server,
      title: 'Data Ownership',
      description: 'Your data stays yours. Export or delete anytime. No vendor lock-in.'
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-400">Privacy First</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
            Your data, your control
          </h2>
          <p className="text-base md:text-lg text-[#9CB3D9] max-w-2xl mx-auto">
            Built with privacy as the foundation. We never sell your data, and you control 
            exactly what Rivor can see and do.
          </p>
        </motion.div>

        {/* Privacy Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {privacyFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-green-400/20 flex items-center justify-center border border-green-500/20">
                  <feature.icon className="h-6 w-6 text-green-400" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-3 text-[#EAF2FF]">
                {feature.title}
              </h3>
              <p className="text-[#9CB3D9] text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Compliance Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap justify-center items-center gap-8 pt-8 border-t border-white/10"
        >
          <div className="text-center">
            <div className="text-sm font-medium text-[#EAF2FF] mb-1">SOC 2 Type II</div>
            <div className="text-xs text-[#6E85AC]">Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-[#EAF2FF] mb-1">GDPR</div>
            <div className="text-xs text-[#6E85AC]">Ready</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-[#EAF2FF] mb-1">CCPA</div>
            <div className="text-xs text-[#6E85AC]">Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-[#EAF2FF] mb-1">OAuth 2.0</div>
            <div className="text-xs text-[#6E85AC]">Secured</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}