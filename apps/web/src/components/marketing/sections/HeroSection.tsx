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
      {/* Hero Layout: Left (headline with gradient-highlighted phrase, subhead, primary/secondary CTAs). Right (animated hero visual) */}
      <div className="grid gap-12 lg:gap-16 lg:grid-cols-2 items-center">
        
        {/* Left: Content */}
        <div className="space-y-8">
          <div className="space-y-6">
            {/* Headline with gradient-highlighted "AI-powered inbox" and flowing underline */}
            <h1 className="animate-on-scroll text-display-lg md:text-display-xl lg:text-display-2xl leading-tight">
              Close deals 2× faster with an{" "}
              <span className="gradient-text relative">
                AI-powered inbox
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-rivor-aqua via-rivor-teal to-rivor-indigo rounded-full animate-flow-underline"></div>
              </span>
            </h1>

            {/* Subhead */}
            <p className="animate-on-scroll text-body-lg text-muted-foreground max-w-lg">
              Rivor merges email, calendar, and pipeline into one smart workspace.
            </p>
          </div>

          {/* Primary/Secondary CTAs with enhanced styling */}
          <div className="animate-on-scroll flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/signin"
              onClick={() => trackCTA("Start Free Trial", "hero", "/auth/signin")}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white font-semibold hover:from-rivor-aqua hover:to-rivor-teal hover-lift focus-visible:ring-2 focus-visible:ring-rivor-teal btn-primary shadow-lg shadow-rivor-teal/25 w-full sm:w-auto"
              data-tooltip="Start 14-day free trial – no credit card"
            >
              Start 14-day free trial – no credit card
            </Link>
            <Link
              href="/demo"
              onClick={() => trackCTA("See Features", "hero", "/demo")}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-rivor-teal/30 bg-surface/80 backdrop-blur hover:bg-rivor-teal/10 hover:border-rivor-teal hover-lift focus-visible:ring-2 focus-visible:ring-rivor-teal transition-all duration-300"
              data-tooltip="See Rivor in action"
            >
              See Features
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="animate-on-scroll flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>SOC2 Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rivor-teal animate-pulse"></div>
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>

        {/* Right: Animated Hero Visual with enhanced animations */}
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
          {/* Background flow lines with enhanced animation */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="flow-line absolute top-16 left-4 md:left-8 w-24 md:w-32 h-0.5 rotate-12 animate-flow-enhanced"></div>
            <div className="flow-line absolute top-32 right-8 md:right-12 w-16 md:w-24 h-0.5 -rotate-12 animate-flow-enhanced-delay"></div>
            <div className="flow-line absolute bottom-24 left-8 md:left-16 w-32 md:w-40 h-0.5 rotate-6 animate-flow-enhanced-delay-2"></div>
          </div>

          {/* Floating cards with enhanced styling and animations */}
          <div className="parallax-card card absolute top-8 left-2 md:left-8 p-3 md:p-4 w-40 md:w-48 hover-lift opacity-0 animate-fade-up bg-gradient-to-br from-rivor-indigo/20 to-rivor-teal/20 border-rivor-aqua/30">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-rivor-aqua animate-pulse"></div>
              <div className="text-xs md:text-sm font-medium text-rivor-aqua">Inbox AI</div>
            </div>
            <div className="text-xs text-muted-foreground">
              📧 New lead inquiry from Sarah Johnson
            </div>
            <div className="text-xs text-rivor-teal mt-1 font-medium">Priority: High</div>
          </div>

          <div className="parallax-card card absolute top-20 md:top-24 right-2 md:right-4 p-3 md:p-4 w-36 md:w-44 hover-lift opacity-0 animate-fade-up-delay-1 bg-gradient-to-br from-rivor-teal/20 to-rivor-aqua/20 border-rivor-teal/30">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-rivor-teal animate-pulse"></div>
              <div className="text-xs md:text-sm font-medium text-rivor-teal">Calendar</div>
            </div>
            <div className="text-xs text-muted-foreground">
              📅 Property showing at 2:00 PM
            </div>
            <div className="text-xs text-rivor-aqua mt-1 font-medium">In 30 minutes</div>
          </div>

          <div className="parallax-card card absolute bottom-12 md:bottom-16 left-4 md:left-12 p-3 md:p-4 w-44 md:w-52 hover-lift opacity-0 animate-fade-up-delay-2 bg-gradient-to-br from-rivor-aqua/20 to-rivor-indigo/20 border-rivor-indigo/30">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-rivor-indigo animate-pulse"></div>
              <div className="text-xs md:text-sm font-medium text-rivor-indigo">Pipeline</div>
            </div>
            <div className="text-xs text-muted-foreground">
              🏠 123 Oak St → Under Contract
            </div>
            <div className="text-xs text-rivor-teal mt-1 font-medium">$485,000</div>
          </div>

          {/* Central connection visual with enhanced animation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-full flow-gradient flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-flow-underline {
          animation: flowUnderline 3s ease-in-out infinite;
        }
        
        @keyframes flowUnderline {
          0%, 100% {
            transform: scaleX(1);
            opacity: 0.8;
          }
          50% {
            transform: scaleX(1.1);
            opacity: 1;
          }
        }
        
        .animate-flow-enhanced {
          animation: flowEnhanced 4s ease-in-out infinite;
        }
        
        .animate-flow-enhanced-delay {
          animation: flowEnhanced 4s ease-in-out infinite 1s;
        }
        
        .animate-flow-enhanced-delay-2 {
          animation: flowEnhanced 4s ease-in-out infinite 2s;
        }
        
        @keyframes flowEnhanced {
          0%, 100% {
            opacity: 0.4;
            transform: scaleX(1);
          }
          50% {
            opacity: 0.8;
            transform: scaleX(1.2);
          }
        }
      `}</style>
    </section>
  );
}
