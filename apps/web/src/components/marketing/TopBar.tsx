"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/branding/Logo";

export default function MarketingTopBar() {
  const [solid, setSolid] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Security", href: "/security" },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Sticky Navigation with enhanced blur and active link highlighting */}
      <div className={`w-full sticky top-0 z-50 transition-all duration-300 ${
        solid 
          ? "backdrop-blur-xl bg-background/80 border-b border-border shadow-lg" 
          : "bg-transparent"
      }`}>
        <div className="container h-16 flex items-center justify-between">
          <Logo />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground hover:text-rivor-teal transition-all duration-200 relative group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-rivor-teal group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              href="/auth/signin" 
              className="px-4 py-2 rounded-xl border border-border bg-surface/50 backdrop-blur hover:bg-muted transition-all duration-200 hover-lift text-sm font-medium"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signin" 
              className="px-4 py-2 rounded-xl brand-gradient text-white font-medium hover-lift transition-all duration-200 text-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle mobile menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`bg-foreground block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
                mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'
              }`}></span>
              <span className={`bg-foreground block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${
                mobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}></span>
              <span className={`bg-foreground block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
                mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'
              }`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border animate-fade-up">
          <div className="container py-6 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="block py-3 text-lg font-medium text-muted-foreground hover:text-rivor-teal transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 space-y-3">
              <Link 
                href="/auth/signin" 
                className="block w-full text-center px-4 py-3 rounded-xl border border-border bg-surface hover:bg-muted transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signin" 
                className="block w-full text-center px-4 py-3 rounded-xl brand-gradient text-white font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}