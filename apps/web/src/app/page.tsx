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
    
    // Force dark theme on mobile - aggressive approach
    if (typeof window !== 'undefined') {
      // Set meta theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#000000');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#000000';
        document.head.appendChild(meta);
      }
      
      // Force dark styles on document
      document.documentElement.style.colorScheme = 'dark';
      document.documentElement.style.backgroundColor = '#000000';
      document.documentElement.style.color = '#ffffff';
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#ffffff';
      
      // Add data attributes for dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-permanent-theme', 'black');
      document.body.setAttribute('data-glass-theme', 'black');
      document.body.setAttribute('data-permanent-theme', 'true');
      
      // Force override any theme context changes with !important styles
      const forceThemeStyle = document.getElementById('force-root-theme');
      if (forceThemeStyle) {
        forceThemeStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = 'force-root-theme';
      style.textContent = `
        html, body {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        * {
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .glass-card, .glass-panel, .glass-button {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const openWaitlist = () => {
    setIsWaitlistOpen(true);
  };

  return (
    <div className={`min-h-screen glass-theme-black text-white overflow-x-hidden`} data-glass-theme="black" data-permanent-theme="black" style={{backgroundColor: '#000000', color: '#ffffff'}}>
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
