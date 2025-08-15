"use client";

import { useState } from "react";

export function SocialProofSection() {
  const [hoveredLogo, setHoveredLogo] = useState<number | null>(null);

  const logoPlaceholders = [
    { name: "Keller Williams", width: "w-32" },
    { name: "RE/MAX", width: "w-24" },
    { name: "Coldwell Banker", width: "w-36" },
    { name: "Century 21", width: "w-28" },
    { name: "Compass", width: "w-24" },
    { name: "eXp Realty", width: "w-26" },
  ];

  return (
    <section className="container py-16 md:py-20">
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
              className={`${logo.width} h-12 rounded-lg bg-muted border border-border flex items-center justify-center animate-fade-up-delay-${Math.min(index + 1, 5)} hover:bg-surface transition-all duration-150 cursor-pointer grayscale hover:grayscale-0`}
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

      {/* Stats or testimonial preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-fade-up-delay-3">
        <div className="text-center">
          <div className="text-2xl font-bold gradient-text mb-2">500+</div>
          <div className="text-sm text-muted-foreground">Active Agents</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold gradient-text mb-2">$2.4B+</div>
          <div className="text-sm text-muted-foreground">Deals Tracked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold gradient-text mb-2">98%</div>
          <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
        </div>
      </div>
    </section>
  );
}
