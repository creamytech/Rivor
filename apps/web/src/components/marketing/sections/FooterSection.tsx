"use client";

import Link from "next/link";
import Logo from "@/components/branding/Logo";

export function FooterSection() {
  const footerLinks = {
    product: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Security", href: "/security" },
      { name: "Integrations", href: "/integrations" },
    ],
    support: [
      { name: "Help Center", href: "/help" },
      { name: "Contact", href: "/contact" },
      { name: "Demo", href: "/demo" },
      { name: "Status", href: "/status" },
    ],
    company: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
    ],
    legal: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      { name: "Security", href: "/security" },
      { name: "DPA", href: "/dpa" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", href: "https://twitter.com/rivor", icon: "🐦" },
    { name: "LinkedIn", href: "https://linkedin.com/company/rivor", icon: "💼" },
    { name: "YouTube", href: "https://youtube.com/rivor", icon: "📺" },
  ];

  return (
    <footer className="bg-surface/50 border-t border-border">
      <div className="container py-16 md:py-20">
        
        {/* Main Footer Content */}
        <div className="grid gap-12 md:gap-16 lg:grid-cols-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <Logo />
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Where Deals Flow Seamlessly
              </p>
            </div>

            {/* Mini CTA */}
            <div className="card p-6 bg-gradient-to-br from-rivor-deep/20 to-rivor-indigo/20 border-rivor-teal/20">
              <h3 className="font-semibold mb-3">Get started in 2 minutes →</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No setup fees, no long contracts. Start your free trial today.
              </p>
              <Link 
                href="/auth/signin"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white text-sm font-medium hover:from-rivor-aqua hover:to-rivor-teal transition-all duration-300"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Email Capture */}
            <div className="space-y-4">
              <h3 className="font-semibold">Stay Updated</h3>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-rivor-teal focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-rivor-teal to-rivor-aqua text-white font-medium hover:from-rivor-aqua hover:to-rivor-teal hover:scale-105 transition-transform"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-muted-foreground">
                Product updates and real estate insights. Unsubscribe anytime.
              </p>
            </div>

            {/* Social Links with hover gradient fill */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg border border-border bg-surface flex items-center justify-center hover:bg-gradient-to-br hover:from-rivor-indigo hover:to-rivor-teal hover:text-white transition-all duration-300 group"
                  aria-label={social.name}
                >
                  <span className="group-hover:scale-110 transition-transform">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-8 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground hover:text-rivor-teal transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground hover:text-rivor-teal transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground hover:text-rivor-teal transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground hover:text-rivor-teal transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Trust Elements */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 Rivor. All rights reserved.
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>All systems operational</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>SOC2 Type II</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🛡️</span>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
