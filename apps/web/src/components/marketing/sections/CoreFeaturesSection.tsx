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
      title: "Smart Inbox Triage",
      description:
        "Surface deal-closing emails and turn threads into next steps automatically.",
      benefits: [
        "Smart email prioritization",
        "Automated thread summaries",
        "Lead qualification scoring",
        "Instant response suggestions"
      ],
      link: "/features/inbox"
    },
    {
      icon: "📅",
      title: "Effortless Auto-Scheduling",
      description:
        "Let clients book showings around your calendar without the back-and-forth.",
      benefits: [
        "Automated scheduling",
        "Buffer time management",
        "Client timezone handling",
        "Smart conflict resolution"
      ],
      link: "/features/calendar"
    },
    {
      icon: "🎯",
      title: "Dynamic Deal Pipeline",
      description:
        "See every deal move forward with automated tasks and insight-driven analytics.",
      benefits: [
        "Visual deal tracking",
        "Automated workflows",
        "Performance insights",
        "Predictive analytics"
      ],
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
            <div className="card p-8 h-full hover-lift group-hover:card-glow transition-all duration-300 relative overflow-hidden">
              {/* Animated background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-rivor-indigo/5 via-rivor-teal/5 to-rivor-aqua/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Icon with enhanced styling */}
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-rivor-indigo/20 to-rivor-teal/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-rivor-teal/20">
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{feature.icon}</span>
              </div>

              {/* Title */}
              <h3 className="relative z-10 text-display-sm mb-4 group-hover:gradient-text transition-all duration-300">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="relative z-10 text-body-md text-muted-foreground mb-6 leading-relaxed">
                {feature.description}
              </p>

              {/* Benefits List with enhanced styling */}
              <ul className="relative z-10 space-y-3 mb-6">
                {feature.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-center gap-3 text-sm group-hover:text-foreground transition-colors duration-300">
                    <div className="w-2 h-2 rounded-full bg-rivor-teal group-hover:scale-125 transition-transform duration-300 flex-shrink-0"></div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA with enhanced animation */}
              <div className="relative z-10 flex items-center gap-2 text-sm font-medium text-rivor-teal group-hover:gap-3 transition-all duration-300">
                <span>Learn more</span>
                <span className="transform group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rivor-teal/10 via-transparent to-rivor-aqua/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16 animate-fade-up-delay-4">
        <Link 
          href="/auth/signin"
          className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white font-semibold hover:from-rivor-aqua hover:to-rivor-teal hover-lift shadow-lg shadow-rivor-teal/25 transition-all duration-300"
        >
          Try All Features Free →
        </Link>
      </div>
    </section>
  );
}
