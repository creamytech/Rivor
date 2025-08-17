"use client";

import { useState } from "react";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individual agents getting started",
      price: { monthly: 29, annual: 290 },
      features: [
        "500 emails/month AI analysis",
        "Basic pipeline management",
        "Calendar integration",
        "Email support",
        "Mobile app access"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Pro",
      description: "Everything you need to scale your business",
      price: { monthly: 79, annual: 790 },
      features: [
        "Unlimited AI email analysis", 
        "Advanced pipeline automation",
        "Calendar + CRM integration",
        "Priority support",
        "Custom workflows",
        "Performance analytics",
        "Team collaboration",
        "API access"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      description: "For teams and brokerages that need more",
      price: { monthly: "Custom", annual: "Custom" },
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Advanced security controls",
        "Dedicated account manager",
        "SLA guarantees",
        "Custom training",
        "White-label options",
        "Enterprise SSO"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const formatPrice = (price: number | string) => {
    if (typeof price === "string") return price;
    return billingCycle === "annual" ? Math.round(price / 12) : price;
  };

  return (
    <section id="pricing" className="py-20 md:py-24 bg-surface/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="text-display-md md:text-display-lg mb-6">
            Plans That Scale With Your{" "}
            <span className="gradient-text">Deals</span>
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business. All plans include a 14-day free trial 
            with no credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 rounded-xl bg-muted border border-border">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all relative ${
                billingCycle === "annual"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white text-xs rounded-full animate-pulse">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`card p-8 relative ${
                index === 0 ? "animate-fade-up-delay-1" : 
                index === 1 ? "animate-fade-up-delay-2" : 
                "animate-fade-up-delay-3"
              } ${plan.popular ? "ring-2 ring-rivor-teal/50 bg-gradient-to-br from-rivor-teal/5 to-rivor-aqua/5" : ""} hover-lift`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="px-6 py-2 bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white text-sm font-semibold rounded-full shadow-lg shadow-rivor-teal/25 animate-pulse">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                
                {/* Price */}
                <div className="mb-6">
                  {typeof plan.price.monthly === "string" ? (
                    <div className="text-3xl font-bold">{plan.price.monthly}</div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">${formatPrice(plan.price[billingCycle])}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      {billingCycle === "annual" && (
                        <div className="text-sm text-muted-foreground mt-1">
                          ${plan.price.annual} billed annually
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* CTA Button */}
                <a
                  href={plan.cta === "Contact Sales" ? "/contact" : "/auth/signin"}
                  className={`inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-medium transition-all hover-lift ${
                    plan.popular
                      ? "bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white shadow-lg shadow-rivor-teal/25 hover:from-rivor-aqua hover:to-rivor-teal"
                      : "border border-border bg-surface hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>

              {/* Features List */}
              <ul className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-rivor-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-rivor-teal" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Preview */}
        <div className="mt-16 text-center animate-fade-up-delay-4">
          <p className="text-muted-foreground mb-4">
            Questions about pricing?{" "}
            <a href="/help" className="text-rivor-teal hover:underline">
              Check our FAQ
            </a>{" "}
            or{" "}
            <a href="/contact" className="text-rivor-teal hover:underline">
              contact our team
            </a>
          </p>
          
          {/* Trust Signals */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📞</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
