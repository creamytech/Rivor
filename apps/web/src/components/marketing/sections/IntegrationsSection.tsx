"use client";

import { useEffect, useRef, useState } from "react";

export function IntegrationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredIntegration, setHoveredIntegration] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate connectors drawing
            const connectors = entry.target.querySelectorAll(".connector-line");
            connectors.forEach((connector, index) => {
              setTimeout(() => {
                connector.classList.add("animate-draw-connector");
              }, index * 300);
            });

            // Animate logos appearing
            const logos = entry.target.querySelectorAll(".integration-logo");
            logos.forEach((logo, index) => {
              setTimeout(() => {
                logo.classList.add("animate-fade-up");
              }, index * 150);
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

  const integrations = [
    {
      name: "Gmail",
      description: "Email & Calendar",
      icon: "📧",
      color: "from-red-500 to-red-600",
      status: "available",
      benefits: ["Email sync", "Calendar integration", "Smart filtering"]
    },
    {
      name: "Outlook", 
      description: "Email & Calendar",
      icon: "📨",
      color: "from-blue-600 to-blue-700",
      status: "available",
      benefits: ["Outlook sync", "Teams integration", "Advanced rules"]
    },
    {
      name: "iCal",
      description: "Calendar sync",
      icon: "📅",
      color: "from-purple-500 to-purple-600",
      status: "available",
      benefits: ["Universal calendar", "Event sync", "Timezone handling"]
    },
    {
      name: "Slack",
      description: "Team communication",
      icon: "💬",
      color: "from-purple-400 to-purple-500",
      status: "coming-soon",
      benefits: ["Team notifications", "Channel integration", "Bot automation"]
    },
    {
      name: "Zapier",
      description: "5000+ app connections",
      icon: "⚡",
      color: "from-orange-500 to-orange-600",
      status: "coming-soon",
      benefits: ["Custom workflows", "App connections", "Advanced automation"]
    },
    {
      name: "HubSpot",
      description: "CRM integration",
      icon: "🎯",
      color: "from-orange-400 to-orange-500",
      status: "coming-soon",
      benefits: ["Lead sync", "Contact management", "Deal tracking"]
    }
  ];

  return (
    <section ref={sectionRef} className="container py-20 md:py-24">
      {/* Section Header */}
      <div className="text-center mb-16 animate-fade-up">
        <h2 className="text-display-md md:text-display-lg mb-6">
          Works With Your{" "}
          <span className="gradient-text">Existing Tools</span>
        </h2>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
          No migration headaches. Rivor seamlessly connects to the platforms you already use, 
          creating a unified workflow without disrupting your existing processes.
        </p>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
        {integrations.map((integration, index) => (
          <div
            key={integration.name}
            className={`integration-logo card p-6 hover-lift opacity-0 cursor-pointer text-center ${
              hoveredIntegration === integration.name ? "card-glow" : ""
            } ${integration.status === "coming-soon" ? "relative" : ""}`}
            onMouseEnter={() => setHoveredIntegration(integration.name)}
            onMouseLeave={() => setHoveredIntegration(null)}
          >
            {/* Coming Soon Badge */}
            {integration.status === "coming-soon" && (
              <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white text-xs font-medium rounded-full animate-pulse">
                Soon
              </div>
            )}

            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center shadow-lg`}>
                <span className="text-xl">{integration.icon}</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-sm">{integration.name}</h3>
                <p className="text-xs text-muted-foreground">{integration.description}</p>
              </div>
            </div>

            {/* Benefits shown on hover */}
            {hoveredIntegration === integration.name && (
              <div className="mt-4 pt-4 border-t border-border animate-fade-up">
                <ul className="space-y-1">
                  {integration.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-rivor-teal"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Security & Compliance */}
      <div className="card p-8 mb-12 animate-fade-up-delay-3">
        <div className="text-center mb-8">
          <h3 className="text-display-sm mb-4">Enterprise-Grade Security</h3>
          <p className="text-muted-foreground">
            All integrations use secure OAuth 2.0 with minimal permissions. Your data is encrypted in transit and at rest.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🔒</span>
            </div>
            <h4 className="font-semibold mb-2">OAuth 2.0 Secure</h4>
            <p className="text-sm text-muted-foreground">Industry-standard authentication with minimal permissions</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🛡️</span>
            </div>
            <h4 className="font-semibold mb-2">End-to-End Encryption</h4>
            <p className="text-sm text-muted-foreground">Your data is encrypted in transit and at rest with AES-256</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">✅</span>
            </div>
            <h4 className="font-semibold mb-2">SOC2 Ready</h4>
            <p className="text-sm text-muted-foreground">Compliance controls and audit trails built-in</p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center animate-fade-up-delay-4">
        <a 
          href="/auth/signin"
          className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white font-semibold hover:from-rivor-aqua hover:to-rivor-teal hover-lift shadow-lg shadow-rivor-teal/25 transition-all duration-300"
        >
          Connect Your Tools →
        </a>
      </div>

      <style jsx>{`
        .connector-line.animate-draw-connector {
          animation: drawConnector 1s ease-out forwards;
          opacity: 1;
        }
        
        @keyframes drawConnector {
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
