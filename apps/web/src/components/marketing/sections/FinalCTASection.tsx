"use client";

import { useEffect, useRef } from "react";

export function FinalCTASection() {
  const sectionRef = useRef<HTMLElement>(null);

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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-24 md:py-32 relative overflow-hidden"
    >
      {/* Animated Background - slow background gradient shift (10-20s loop) */}
      <div className="absolute inset-0 bg-gradient-to-br from-rivor-deep via-rivor-indigo to-rivor-teal opacity-90"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-rivor-teal via-rivor-aqua to-rivor-indigo opacity-70 animate-slow-shift"></div>
      
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="container relative z-10 text-center text-white">
        {/* Headline */}
        <h2 className="text-display-lg md:text-display-xl lg:text-display-2xl mb-8 opacity-0 animate-on-scroll">
          Ready to{" "}
          <span className="relative">
            Flow?
            <div className="absolute inset-0 bg-gradient-to-r from-rivor-aqua/30 to-rivor-teal/30 blur-xl animate-pulse"></div>
          </span>
        </h2>

        {/* Subtext */}
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto opacity-0 animate-on-scroll-delay-1">
          Join hundreds of real estate professionals who've transformed their workflow. 
          Start your free trial today—no credit card required.
        </p>

        {/* Dual CTAs with slide-up animation */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center opacity-0 animate-on-scroll-delay-2">
          <a 
            href="/auth/signin"
            className="inline-flex items-center justify-center px-10 py-5 rounded-xl bg-white text-rivor-deep font-semibold text-lg hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            Start Free Trial
            <span className="ml-2 text-xl">→</span>
          </a>
          
          <a 
            href="/demo"
            className="inline-flex items-center justify-center px-10 py-5 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur text-white font-semibold text-lg hover:bg-white/20 hover:scale-105 transition-all duration-300"
          >
            Watch Demo
            <span className="ml-2 text-xl">▶️</span>
          </a>
        </div>

        {/* Trust Signals */}
        <div className="mt-12 opacity-0 animate-on-scroll-delay-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Setup in under 5 minutes</span>
            </div>
          </div>
        </div>

        {/* Social Proof Micro */}
        <div className="mt-16 opacity-0 animate-on-scroll-delay-4">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">500+</div>
            <div className="text-white/80">Agents already using Rivor</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-slow-shift {
          animation: slowShift 20s ease-in-out infinite;
        }
        
        @keyframes slowShift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }

        .animate-on-scroll {
          animation: fadeUpSlide 0.8s ease-out 0.2s forwards;
        }

        .animate-on-scroll-delay-1 {
          animation: fadeUpSlide 0.8s ease-out 0.4s forwards;
        }

        .animate-on-scroll-delay-2 {
          animation: fadeUpSlide 0.8s ease-out 0.6s forwards;
        }

        .animate-on-scroll-delay-3 {
          animation: fadeUpSlide 0.8s ease-out 0.8s forwards;
        }

        .animate-on-scroll-delay-4 {
          animation: fadeUpSlide 0.8s ease-out 1.0s forwards;
        }

        @keyframes fadeUpSlide {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
