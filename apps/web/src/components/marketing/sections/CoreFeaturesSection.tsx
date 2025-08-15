"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export function CoreFeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(".feature-card");
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add("animate-fade-up");
              }, index * 100);
            });
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

  const features = [
    {
      icon: "📥",
      title: "Unified Inbox",
      description: "AI-powered email summaries turn conversation threads into actionable insights. Never miss a lead or important follow-up.",
      benefits: ["Smart email prioritization", "Automated thread summaries", "Lead qualification scoring"],
      link: "/features/inbox"
    },
    {
      icon: "📅", 
      title: "Smart Scheduling",
      description: "Calendar integration that automatically schedules showings, calls, and meetings based on your availability and preferences.",
      benefits: ["Automated scheduling", "Buffer time management", "Client timezone handling"],
      link: "/features/calendar"
    },
    {
      icon: "🎯",
      title: "Pipeline Power", 
      description: "Visual deal tracking with automated stage progression, task generation, and performance analytics to close more deals.",
      benefits: ["Visual deal tracking", "Automated workflows", "Performance insights"],
      link: "/features/pipeline"
    }
  ];

  return (
    <section ref={sectionRef} id="features" className="container py-20 md:py-24">
      {/* Section Header */}
      <div className="text-center mb-16 animate-fade-up">
        <h2 className="text-display-md md:text-display-lg mb-6">
          Three Core Features,{" "}
          <span className="gradient-text">Unified Experience</span>
        </h2>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
          Stop switching between apps. Rivor brings your inbox, calendar, and pipeline 
          together with AI that actually helps you close more deals.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid gap-8 md:grid-cols-3">
        {features.map((feature, index) => (
          <Link 
            key={feature.title}
            href={feature.link}
            className="feature-card group block opacity-0"
          >
            <div className="card p-8 h-full hover-lift group-hover:card-glow transition-all duration-300">
              {/* Icon with gradient accent */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rivor-indigo/20 to-rivor-teal/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">{feature.icon}</span>
              </div>

              {/* Title */}
              <h3 className="text-display-sm mb-4 group-hover:gradient-text transition-all duration-300">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-body-md text-muted-foreground mb-6 leading-relaxed">
                {feature.description}
              </p>

              {/* Benefits List */}
              <ul className="space-y-2 mb-6">
                {feature.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-center gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-rivor-teal"></div>
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex items-center gap-2 text-sm font-medium text-rivor-teal group-hover:gap-3 transition-all duration-300">
                <span>Learn more</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16 animate-fade-up-delay-4">
        <Link 
          href="/auth/signin"
          className="inline-flex items-center justify-center px-8 py-4 rounded-xl brand-gradient text-white font-medium hover-lift"
        >
          Try All Features Free
        </Link>
      </div>
    </section>
  );
}
