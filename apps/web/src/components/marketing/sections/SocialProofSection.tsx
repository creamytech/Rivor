"use client";

import { useState, useEffect, useRef } from "react";

type Stats = {
  agents: number;
  deals: number;
  satisfaction: number;
};

export function SocialProofSection() {
  const [hoveredLogo, setHoveredLogo] = useState<number | null>(null);
  const [countedStats, setCountedStats] = useState<Stats>({
    agents: 0,
    deals: 0,
    satisfaction: 0
  });
  const [stats, setStats] = useState<Stats>({
    agents: 0,
    deals: 0,
    satisfaction: 0
  });
  const sectionRef = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/marketing/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data: Stats = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch social proof stats:", error);
      }
    }

    fetchStats();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateCountUp(stats);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [stats]);

  const animateCountUp = (target: Stats) => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setCountedStats({
        agents: Math.floor(target.agents * progress),
        deals: Math.floor(target.deals * progress * 100) / 100, // Keep 2 decimal places
        satisfaction: Math.floor(target.satisfaction * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCountedStats(target);
      }
    }, stepDuration);
  };

  const logos = [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Keller_Williams_logo.svg",
      alt: "Keller Williams logo",
      width: "w-32"
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/2/2f/ReMax_logo.svg",
      alt: "RE/MAX logo",
      width: "w-24"
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Coldwell_Banker_logo.svg",
      alt: "Coldwell Banker logo",
      width: "w-36"
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Century_21_2018_logo.svg",
      alt: "Century 21 logo",
      width: "w-28"
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/4/49/Compass_Real_Estate_logo.svg",
      alt: "Compass Real Estate logo",
      width: "w-24"
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/6/69/EXP_Realty_logo.svg",
      alt: "eXp Realty logo",
      width: "w-26"
    }
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
          {logos.map((logo, index) => (
            <div
              key={logo.alt}
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
              <img src={logo.src} alt={logo.alt} className="max-h-full" />
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

      {/* Testimonial preview */}
      <div className="mt-12 text-center animate-fade-up-delay-4">
        <div className="card p-8 max-w-2xl mx-auto bg-gradient-to-br from-rivor-deep/20 to-rivor-indigo/20 border-rivor-teal/20">
          <div className="text-lg text-muted-foreground mb-4">
            "Rivor saves me 10+ hours per week. I never miss a client email."
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rivor-teal to-rivor-aqua flex items-center justify-center text-white font-bold">
              J
            </div>
            <div className="text-left">
              <div className="font-semibold">Jane D.</div>
              <div className="text-sm text-muted-foreground">Realtor, Keller Williams</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
