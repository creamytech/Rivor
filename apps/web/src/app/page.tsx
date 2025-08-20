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

  // Analytics event for page view
  useEffect(() => {
    // Fire waitlist_view event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'waitlist_view', {
        page_title: 'Rivor Landing Page',
        page_location: window.location.href,
      });
    }
  }, []);

  const openWaitlist = () => {
    setIsWaitlistOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0E1420] text-[#EAF2FF] overflow-x-hidden">
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
