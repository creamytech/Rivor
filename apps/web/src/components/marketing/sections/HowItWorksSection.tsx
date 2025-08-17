"use client";

import { useEffect, useRef, useState } from "react";

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate the timeline drawing
            const timeline = entry.target.querySelector(".timeline-line");
            if (timeline) {
              timeline.classList.add("animate-draw");
            }
            
            // Stagger step animations
            const steps = entry.target.querySelectorAll(".step-item");
            steps.forEach((step, index) => {
              setTimeout(() => {
                step.classList.add("animate-fade-up");
              }, index * 200);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: "01",
      title: "Connect Your Tools",
      subtitle: "Gmail, Outlook, Calendar",
      description: "Link Gmail/Outlook and Calendar with secure, least-privilege OAuth. Your data stays encrypted and private.",
      details: ["OAuth 2.0 secure connection", "Read-only email access", "Calendar integration", "Encryption at rest"],
      icon: "🔗"
    },
    {
      number: "02", 
      title: "Automate the Busy Work",
      subtitle: "Scheduling, follow-ups, lead tracking",
      description: "AI analyzes your emails, extracts key information, and automatically updates your pipeline with lead details and next steps.",
      details: ["AI email analysis", "Lead qualification", "Auto-categorization", "Smart notifications"],
      icon: "🤖"
    },
    {
      number: "03",
      title: "Close More Deals",
      subtitle: "Spend time selling, not juggling tasks",
      description: "Track every opportunity with visual pipeline management, automated follow-ups, and insights that help you close more deals faster.",
      details: ["Visual pipeline", "Automated follow-ups", "Performance analytics", "Deal insights"],
      icon: "🎯"
    }
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="py-20 md:py-24 bg-surface/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="text-display-md md:text-display-lg mb-6">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes, not hours. Our intelligent automation works behind 
            the scenes so you can focus on what matters most: your clients.
          </p>
        </div>

        {/* Horizontal Timeline */}
        <div className="relative max-w-6xl mx-auto">
          {/* Timeline Line */}
          <div className="timeline-line absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-rivor-indigo via-rivor-teal to-rivor-aqua transform -translate-y-1/2 opacity-0"></div>
          
          {/* Steps in horizontal layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={`step-item relative opacity-0 text-center ${
                  index < steps.length - 1 ? "md:after:content-['→'] md:after:absolute md:after:top-1/2 md:after:right-[-2rem] md:after:transform md:after:-translate-y-1/2 md:after:text-2xl md:after:text-rivor-teal md:after:opacity-50" : ""
                }`}
                onMouseEnter={() => setActiveStep(index)}
              >
                {/* Step Number Circle */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-rivor-indigo to-rivor-teal flex items-center justify-center text-white font-bold mx-auto mb-6 z-10 relative ${
                  activeStep === index ? "scale-110 shadow-lg shadow-rivor-teal/30" : ""
                } transition-all duration-300`}>
                  <span className="text-xl">{step.icon}</span>
                </div>

                {/* Content */}
                <div className={`card p-6 ${
                  activeStep === index ? "card-glow" : ""
                } hover-lift transition-all duration-300`}>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-sm font-mono text-rivor-teal">{step.number}</span>
                  </div>
                  
                  <h3 className="text-display-sm mb-2">{step.title}</h3>
                  <p className="text-sm text-rivor-teal font-medium mb-4">{step.subtitle}</p>
                  
                  <p className="text-body-md text-muted-foreground mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Step Details - shown on hover */}
                  <div className={`space-y-2 transition-all duration-300 ${
                    activeStep === index ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden"
                  }`}>
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-rivor-teal flex-shrink-0"></div>
                        <span className="text-muted-foreground">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-fade-up-delay-4">
          <div className="mb-4">
            <span className="text-sm text-muted-foreground">Ready to get started?</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth/signin"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white font-semibold hover:from-rivor-aqua hover:to-rivor-teal hover-lift shadow-lg shadow-rivor-teal/25 transition-all duration-300"
            >
              Start Free Trial →
            </a>
            <a 
              href="/demo"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-rivor-teal/30 bg-surface/80 backdrop-blur hover:bg-rivor-teal/10 hover:border-rivor-teal hover-lift transition-all duration-300"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .timeline-line.animate-draw {
          animation: drawLine 2s ease-out forwards;
          opacity: 1;
        }
        
        @keyframes drawLine {
          from {
            clip-path: inset(0 100% 0 0);
          }
          to {
            clip-path: inset(0 0 0 0);
          }
        }
      `}</style>
    </section>
  );
}
