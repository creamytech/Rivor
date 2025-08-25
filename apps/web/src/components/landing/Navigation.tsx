"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  onWaitlistClick: () => void;
}

export default function Navigation({ onWaitlistClick }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { label: 'Product', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass-nav-enhanced ${
        scrolled 
          ? 'glass-card border-b border-white/20 backdrop-blur-xl bg-black/30 glass-glow' 
          : 'glass-panel backdrop-blur-lg bg-black/20 border-b border-white/10'
      }`}
      style={{
        backdropFilter: 'blur(20px) saturate(1.2) brightness(1.1)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.2) brightness(1.1)',
        background: scrolled 
          ? 'rgba(0, 0, 0, 0.4)' 
          : 'rgba(0, 0, 0, 0.25)',
        borderImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent) 1',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <div className="relative overflow-visible">
              {/* Liquid glass backdrop */}
              <div 
                className="absolute -inset-3 rounded-2xl opacity-60"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(20px) saturate(1.6)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                  boxShadow: `
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    0 4px 20px rgba(6, 182, 212, 0.15),
                    0 8px 32px rgba(6, 182, 212, 0.1)
                  `,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
              {/* Shimmer effect */}
              <div 
                className="absolute -inset-3 rounded-2xl opacity-40"
                style={{
                  background: 'linear-gradient(135deg, transparent 30%, rgba(6, 182, 212, 0.2) 50%, transparent 70%)',
                  animation: 'shimmer 4s ease-in-out infinite'
                }}
              />
              <motion.img
                src='/images/Full%20Sidebar%20Dark%20Mode.svg'
                alt="Rivor"
                className="relative h-8 w-auto object-contain z-10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  filter: `
                    drop-shadow(0 0 10px rgba(6, 182, 212, 0.4))
                    drop-shadow(0 0 20px rgba(6, 182, 212, 0.2))
                    brightness(1.1)
                    saturate(1.2)
                  `,
                  maxWidth: '160px'
                }}
              />
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href.slice(1))}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                {link.label}
              </button>
            ))}
            <Button
              onClick={onWaitlistClick}
              className="rounded-xl px-5 py-2 font-medium text-white relative overflow-hidden group transition-all duration-300"
              aria-label="Join the Rivor waitlist"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.1),
                  0 4px 15px rgba(6, 182, 212, 0.1)
                `
              }}
            >
              <span className="relative z-10">Join Waitlist</span>
              {/* Hover effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  backdropFilter: 'blur(25px)'
                }}
              />
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                  animation: 'shimmer 3s ease-in-out infinite'
                }}
              />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 text-white/80 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-panel backdrop-blur-xl bg-black/30 border-t border-white/20"
          >
            <div className="px-6 py-4 space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href.slice(1))}
                  className="block text-white/80 hover:text-white transition-colors text-sm font-medium w-full text-left"
                >
                  {link.label}
                </button>
              ))}
              <Button
                onClick={() => {
                  onWaitlistClick();
                  setIsMenuOpen(false);
                }}
                className="w-full rounded-xl px-5 py-2 font-medium text-white relative overflow-hidden group transition-all duration-300 mt-4"
                aria-label="Join the Rivor waitlist"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    0 4px 15px rgba(6, 182, 212, 0.1)
                  `
                }}
              >
                <span className="relative z-10">Join Waitlist</span>
                {/* Hover effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    backdropFilter: 'blur(25px)'
                  }}
                />
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                    animation: 'shimmer 3s ease-in-out infinite'
                  }}
                />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}