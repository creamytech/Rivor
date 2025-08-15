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
      title: "Connect",
      description: "Link Gmail/Outlook and Calendar with secure, least-privilege OAuth. Your data stays encrypted and private.",
      details: ["OAuth 2.0 secure connection", "Read-only email access", "Calendar integration", "Encryption at rest"],
      icon: "🔗"
    },
    {
      number: "02", 
      title: "Automate",
      description: "AI analyzes your emails, extracts key information, and automatically updates your pipeline with lead details and next steps.",
      details: ["AI email analysis", "Lead qualification", "Auto-categorization", "Smart notifications"],
      icon: "🤖"
    },
    {
      number: "03",
      title: "Close Deals",
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

        {/* Timeline Container */}
        <div className="relative max-w-4xl mx-auto">
          {/* Timeline Line - draws as you scroll */}
          <div className="timeline-line absolute left-8 md:left-1/2 top-16 w-0.5 h-full bg-gradient-to-b from-rivor-indigo via-rivor-teal to-rivor-aqua transform md:-translate-x-1/2 opacity-0"></div>
          
          {/* Steps */}
          <div className="space-y-16 md:space-y-20">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={`step-item relative opacity-0 ${
                  index % 2 === 0 ? "md:pr-8" : "md:pl-8 md:ml-auto"
                } md:w-1/2 pl-20 md:pl-0`}
                onMouseEnter={() => setActiveStep(index)}
              >
                {/* Step Number Circle */}
                <div className={`absolute left-6 md:left-auto ${
                  index % 2 === 0 ? "md:-right-6" : "md:-left-6"
                } w-12 h-12 rounded-full bg-gradient-to-br from-rivor-indigo to-rivor-teal flex items-center justify-center text-white font-bold z-10 ${
                  activeStep === index ? "scale-110 shadow-lg shadow-rivor-teal/30" : ""
                } transition-all duration-300`}>
                  <span className="text-xl">{step.icon}</span>
                </div>

                {/* Content Card */}
                <div className={`card p-8 ${
                  activeStep === index ? "card-glow" : ""
                } hover-lift transition-all duration-300`}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-mono text-rivor-teal">{step.number}</span>
                    <h3 className="text-display-sm">{step.title}</h3>
                  </div>
                  
                  <p className="text-body-md text-muted-foreground mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Step Details */}
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-rivor-teal"></div>
                        <span className="text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
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
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl brand-gradient text-white font-medium hover-lift"
            >
              Start Free Trial
            </a>
            <a 
              href="/demo"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border bg-surface/50 backdrop-blur hover-lift"
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
            height: 0;
          }
          to {
            height: 100%;
          }
        }
      `}</style>
    </section>
  );
}
