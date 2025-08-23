"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/landing/Navigation';
import HeroSection from '@/components/landing/HeroSection';
import WhyRivorSection from '@/components/landing/WhyRivorSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturePanels from '@/components/landing/FeaturePanels';
import PrivacySection from '@/components/landing/PrivacySection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import Footer from '@/components/landing/Footer';
import WaitlistModal from '@/components/landing/WaitlistModal';
import RiverDivider from '@/components/landing/RiverDivider';

export default function Home() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  // Analytics event for page view and force dark mode on mobile
  useEffect(() => {
    // Fire waitlist_view event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'waitlist_view', {
        page_title: 'Rivor Landing Page',
        page_location: window.location.href,
      });
    }
    
    // Force dark theme on mobile
    if (typeof window !== 'undefined') {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#0a0f1f');
      }
      
      // Set color scheme to dark only
      document.documentElement.style.colorScheme = 'dark';
    }
  }, []);

  const openWaitlist = () => {
    setIsWaitlistOpen(true);
  };

  return (
    <div className="min-h-screen glass-theme-black text-white overflow-x-hidden" data-glass-theme="black">
      {/* Navigation */}
      <Navigation onWaitlistClick={openWaitlist} />
      
      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection onWaitlistClick={openWaitlist} />
        
        <RiverDivider />
        
        {/* Why Rivor Section */}
        <WhyRivorSection />
        
        <RiverDivider />
        
        {/* How It Works Section */}
        <HowItWorksSection />
        
        <RiverDivider />
        
        {/* Feature Panels */}
        <FeaturePanels onWaitlistClick={openWaitlist} />
        
        <RiverDivider />
        
        {/* Privacy & Security */}
        <PrivacySection />
        
        <RiverDivider />
        
        {/* FAQ */}
        <FAQSection />
        
        <RiverDivider />
        
        {/* Final CTA */}
        <FinalCTASection onWaitlistClick={openWaitlist} />
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Waitlist Modal */}
      <WaitlistModal 
        isOpen={isWaitlistOpen} 
        onClose={() => setIsWaitlistOpen(false)} 
      />
    </div>
  );
}
