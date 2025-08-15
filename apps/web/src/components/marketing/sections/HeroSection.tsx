"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTrackCTA } from "@/components/providers/AnalyticsProvider";

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const trackCTA = useTrackCTA();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = heroRef.current?.querySelectorAll(".animate-on-scroll");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleParallax = (e: React.MouseEvent) => {
    const cards = heroRef.current?.querySelectorAll(".parallax-card");
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    const x = (clientX / innerWidth - 0.5) * 12;
    const y = (clientY / innerHeight - 0.5) * 12;

    cards?.forEach((card, index) => {
      const element = card as HTMLElement;
      const multiplier = (index + 1) * 0.3;
      // Use CSS custom properties to avoid conflicting with other transforms
      element.style.setProperty('--parallax-x', `${x * multiplier}px`);
      element.style.setProperty('--parallax-y', `${y * multiplier}px`);
    });
  };

  return (
    <section 
      ref={heroRef}
      className="relative container pt-24 pb-16 md:pt-32 md:pb-24"
      onMouseMove={handleParallax}
    >
      {/* Hero Layout: Left (headline w/ gradient-highlight word "Flow", subhead, primary/secondary CTAs). Right (animated hero visual) */}
      <div className="grid gap-12 lg:gap-16 lg:grid-cols-2 items-center">
        
        {/* Left: Content */}
        <div className="space-y-8">
          <div className="space-y-6">
            {/* Headline with gradient-highlighted "Flow" */}
            <h1 className="animate-on-scroll text-display-lg md:text-display-xl lg:text-display-2xl leading-tight">
              Where Deals{" "}
              <span className="gradient-text">Flow</span>{" "}
              Seamlessly
            </h1>
            
            {/* Subhead */}
            <p className="animate-on-scroll text-body-lg text-muted-foreground max-w-lg">
              Rivor unifies your inbox, calendar, and pipeline with AI-powered insights. 
              Turn email chaos into closed deals with effortless automation.
            </p>
          </div>

          {/* Primary/Secondary CTAs */}
          <div className="animate-on-scroll flex flex-col sm:flex-row gap-4">
            <Link 
              href="/auth/signin" 
              onClick={() => trackCTA("Get Started Free", "hero", "/auth/signin")}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl brand-gradient text-white font-medium hover-lift focus-visible:ring-2 focus-visible:ring-rivor-teal btn-primary"
              data-tooltip="Start your free 14-day trial"
            >
              Get Started Free
            </Link>
            <Link 
              href="/demo" 
              onClick={() => trackCTA("Watch Demo", "hero", "/demo")}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border bg-surface/50 backdrop-blur hover-lift focus-visible:ring-2 focus-visible:ring-rivor-teal"
              data-tooltip="See Rivor in action"
            >
              Watch Demo
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="animate-on-scroll flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>SOC2 Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rivor-teal"></div>
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>

        {/* Right: Animated Hero Visual */}
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
          {/* Background flow lines */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="flow-line absolute top-16 left-4 md:left-8 w-24 md:w-32 h-0.5 rotate-12"></div>
            <div className="flow-line absolute top-32 right-8 md:right-12 w-16 md:w-24 h-0.5 -rotate-12"></div>
            <div className="flow-line absolute bottom-24 left-8 md:left-16 w-32 md:w-40 h-0.5 rotate-6"></div>
          </div>

          {/* Floating cards representing email, calendar, pipeline */}
          <div className="parallax-card card absolute top-8 left-2 md:left-8 p-3 md:p-4 w-40 md:w-48 hover-lift opacity-0 animate-fade-up">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-rivor-aqua"></div>
              <div className="text-xs md:text-sm font-medium">Inbox AI</div>
            </div>
            <div className="text-xs text-muted-foreground">
              📧 New lead inquiry from Sarah Johnson
            </div>
            <div className="text-xs text-rivor-teal mt-1">Priority: High</div>
          </div>

          <div className="parallax-card card absolute top-20 md:top-24 right-2 md:right-4 p-3 md:p-4 w-36 md:w-44 hover-lift opacity-0 animate-fade-up-delay-1">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-rivor-indigo"></div>
              <div className="text-xs md:text-sm font-medium">Calendar</div>
            </div>
            <div className="text-xs text-muted-foreground">
              📅 Property showing at 2:00 PM
            </div>
            <div className="text-xs text-rivor-teal mt-1">In 30 minutes</div>
          </div>

          <div className="parallax-card card absolute bottom-12 md:bottom-16 left-4 md:left-12 p-3 md:p-4 w-44 md:w-52 hover-lift opacity-0 animate-fade-up-delay-2">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-rivor-teal"></div>
              <div className="text-xs md:text-sm font-medium">Pipeline</div>
            </div>
            <div className="text-xs text-muted-foreground">
              🏠 123 Oak St → Under Contract
            </div>
            <div className="text-xs text-rivor-teal mt-1">$485,000</div>
          </div>

          {/* Central connection visual */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-full flow-gradient flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
