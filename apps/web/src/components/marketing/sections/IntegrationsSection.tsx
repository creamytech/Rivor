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
      name: "Google Workspace",
      description: "Gmail, Calendar, Drive",
      icon: "🌐",
      color: "from-blue-500 to-green-500",
      benefits: ["Email sync", "Calendar integration", "File access"]
    },
    {
      name: "Microsoft 365", 
      description: "Outlook, Calendar, OneDrive",
      icon: "📨",
      color: "from-blue-600 to-purple-600",
      benefits: ["Outlook sync", "Teams integration", "SharePoint access"]
    },
    {
      name: "Zapier",
      description: "Connect 5000+ apps",
      icon: "⚡",
      color: "from-orange-500 to-yellow-500",
      benefits: ["Custom workflows", "App connections", "Automation"]
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

      {/* Integration Diagram */}
      <div className="relative max-w-4xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center">
          
          {/* Left: External Integrations */}
          <div className="space-y-6">
            {integrations.map((integration, index) => (
              <div
                key={integration.name}
                className={`integration-logo card p-6 hover-lift opacity-0 cursor-pointer ${
                  hoveredIntegration === integration.name ? "card-glow" : ""
                }`}
                onMouseEnter={() => setHoveredIntegration(integration.name)}
                onMouseLeave={() => setHoveredIntegration(null)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center`}>
                    <span className="text-xl">{integration.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>

                {/* Benefits shown on hover */}
                {hoveredIntegration === integration.name && (
                  <div className="mt-4 pt-4 border-t border-border animate-fade-up">
                    <ul className="space-y-1">
                      {integration.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
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

          {/* Center: Connector Lines */}
          <div className="relative h-32 md:h-64 flex items-center justify-center">
            {/* Horizontal connectors */}
            <div className="connector-line absolute inset-0 flex items-center justify-center opacity-0">
              <div className="w-full h-0.5 bg-gradient-to-r from-rivor-indigo via-rivor-teal to-rivor-aqua"></div>
            </div>
            
            {/* Animated flow indicators */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rivor-indigo to-rivor-teal flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white/30 backdrop-blur animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Right: Rivor Logo */}
          <div className="flex justify-center">
            <div className="integration-logo card p-8 bg-gradient-to-br from-rivor-deep to-rivor-indigo text-white opacity-0">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">R</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Rivor</h3>
                <p className="text-sm opacity-80">Unified Workspace</p>
              </div>
            </div>
          </div>
        </div>
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
          className="inline-flex items-center justify-center px-8 py-4 rounded-xl brand-gradient text-white font-medium hover-lift"
        >
          Connect Your Tools
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
