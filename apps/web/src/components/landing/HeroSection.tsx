"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowDown, Mail, BarChart3, MessageSquare, Calendar } from 'lucide-react';
import ProductPreview from './ProductPreview';

interface HeroSectionProps {
  onWaitlistClick: () => void;
}

export default function HeroSection({ onWaitlistClick }: HeroSectionProps) {
  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E5EFF]/5 via-transparent to-[#3AF6C3]/5" />
      
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight mb-6">
              Close more deals with an{' '}
              <span className="bg-gradient-to-r from-[#1E5EFF] via-[#16C4D9] to-[#3AF6C3] bg-clip-text text-transparent">
                AI-powered
              </span>{' '}
              real estate workspace
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[#9CB3D9] max-w-prose mb-8 leading-relaxed">
              Rivor turns inbox chaos into a clean flow—triage emails, auto-draft replies, 
              schedule showings, and keep your pipeline moving.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                onClick={onWaitlistClick}
                size="lg"
                className="rounded-xl px-4 sm:px-6 md:px-8 py-3 sm:py-4 font-medium text-white relative overflow-hidden group transition-all duration-300 text-sm sm:text-base md:text-lg whitespace-nowrap"
                aria-label="Join the Rivor waitlist"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(25px) saturate(1.6)',
                  WebkitBackdropFilter: 'blur(25px) saturate(1.6)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: `
                    inset 0 1px 0 rgba(255, 255, 255, 0.15),
                    0 8px 32px rgba(6, 182, 212, 0.15),
                    0 12px 48px rgba(6, 182, 212, 0.1)
                  `
                }}
              >
                <span className="relative z-10">Join the Waitlist</span>
                {/* Enhanced hover effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'rgba(6, 182, 212, 0.2)',
                    backdropFilter: 'blur(30px)'
                  }}
                />
                {/* Liquid shimmer */}
                <div 
                  className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%)',
                    animation: 'shimmer 4s ease-in-out infinite'
                  }}
                />
              </Button>
              
              <Button
                onClick={scrollToFeatures}
                variant="outline"
                size="lg"
                className="rounded-xl px-4 sm:px-6 md:px-8 py-3 sm:py-4 font-medium text-white relative overflow-hidden group transition-all duration-300 text-sm sm:text-base md:text-lg whitespace-nowrap"
                aria-label="Learn more about Rivor features"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(20px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: `
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    0 4px 20px rgba(255, 255, 255, 0.05)
                  `
                }}
              >
                <span className="relative z-10 flex items-center">
                  See the product
                  <ArrowDown className="ml-2 h-4 w-4" />
                </span>
                {/* Subtle hover effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(25px)'
                  }}
                />
              </Button>
            </div>

            {/* Trust Copy */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-sm text-[#6E85AC] flex items-center justify-center lg:justify-start gap-2"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Private by default. You control what Rivor sees.
            </motion.p>
          </motion.div>

          {/* Right Content - Product Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative order-first lg:order-last"
          >
            <ProductPreview />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-3 bg-gradient-to-b from-[#1E5EFF] to-[#16C4D9] rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}