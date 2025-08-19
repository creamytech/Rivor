"use client";

import { useState, useEffect, useRef } from "react";
import { TestimonialsCarousel } from "./TestimonialsCarousel";

export function SocialProofSection() {
  const [hoveredLogo, setHoveredLogo] = useState<number | null>(null);
  const [countedStats, setCountedStats] = useState({
    agents: 0,
    deals: 0,
    satisfaction: 0
  });
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start count-up animation
            animateCountUp();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animateCountUp = () => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setCountedStats({
        agents: Math.floor(500 * progress),
        deals: Math.floor(2.4 * progress * 100) / 100, // Keep 2 decimal places
        satisfaction: Math.floor(98 * progress)
      });
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setCountedStats({
          agents: 500,
          deals: 2.4,
          satisfaction: 98
        });
      }
    }, stepDuration);
  };

  const logoPlaceholders = [
    { name: "Keller Williams", width: "w-32" },
    { name: "RE/MAX", width: "w-24" },
    { name: "Coldwell Banker", width: "w-36" },
    { name: "Century 21", width: "w-28" },
    { name: "Compass", width: "w-24" },
    { name: "eXp Realty", width: "w-26" },
  ];

  return (
    <section ref={sectionRef} className="container py-16 md:py-20">
      {/* "Trusted by …" strip */}
      <div className="text-center mb-12">
        <p className="text-sm text-muted-foreground mb-8 animate-fade-up">
          Trusted by real estate professionals across the country
        </p>
        
        {/* Grayscale logos (hover to color) with stagger-in animation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-60 hover:opacity-100 transition-opacity duration-300">
          {logoPlaceholders.map((logo, index) => (
            <div
              key={logo.name}
              className={`${logo.width} h-12 rounded-lg bg-muted border border-border flex items-center justify-center ${
                index === 0 ? "animate-fade-up-delay-1" :
                index === 1 ? "animate-fade-up-delay-2" :
                index === 2 ? "animate-fade-up-delay-3" :
                index === 3 ? "animate-fade-up-delay-4" :
                index === 4 ? "animate-fade-up-delay-5" :
                "animate-fade-up-delay-5"
              } hover:bg-surface transition-all duration-150 cursor-pointer grayscale hover:grayscale-0`}
              onMouseEnter={() => setHoveredLogo(index)}
              onMouseLeave={() => setHoveredLogo(null)}
              style={{ 
                animationDelay: `${index * 100}ms`,
                transform: hoveredLogo === index ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Stats with icons and count-up animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-fade-up-delay-3">
        <div className="text-center group">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rivor-indigo/20 to-rivor-teal/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">🏠</span>
            </div>
          </div>
          <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
            {countedStats.agents}+
          </div>
          <div className="text-lg text-muted-foreground font-medium">Active Agents</div>
        </div>
        
        <div className="text-center group">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rivor-teal/20 to-rivor-aqua/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
            ${countedStats.deals}B+
          </div>
          <div className="text-lg text-muted-foreground font-medium">Deals Tracked</div>
        </div>
        
        <div className="text-center group">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rivor-aqua/20 to-rivor-indigo/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
          <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
            {countedStats.satisfaction}%
          </div>
          <div className="text-lg text-muted-foreground font-medium">Satisfaction Rate</div>
        </div>
      </div>

      <TestimonialsCarousel />
    </section>
  );
}
