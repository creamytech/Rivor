"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Plus, Calendar, Mail, MessageSquare, Sparkles } from 'lucide-react';

interface StickyActionStripProps {
  className?: string;
}

export default function StickyActionStrip({ className = '' }: StickyActionStripProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsVisible(scrollTop > 100);
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const actions = [
    {
      icon: Plus,
      label: 'Add Deal',
      href: '/app/pipeline?add=true',
      color: 'from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-700 dark:text-green-300'
    },
    {
      icon: Calendar,
      label: 'Schedule',
      href: '/app/calendar?add=true',
      color: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    {
      icon: Mail,
      label: 'Compose',
      href: '/app/inbox?compose=true',
      color: 'from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-700 dark:text-purple-300'
    },
    {
      icon: MessageSquare,
      label: 'Ask AI',
      href: '/app/chat',
      color: 'from-teal-500/20 to-indigo-500/20 hover:from-teal-500/30 hover:to-indigo-500/30',
      borderColor: 'border-teal-500/30',
      textColor: 'text-teal-700 dark:text-teal-300'
    }
  ];

  return (
    <div 
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      } ${className}`}
    >
      <GlassCard 
        variant="gradient" 
        intensity="medium"
        className={`backdrop-blur-xl border-white/30 shadow-2xl ${
          isScrolled ? 'scale-105' : 'scale-100'
        } transition-transform duration-300`}
      >
        <GlassCardContent className="p-2">
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <Button
                key={action.label}
                variant="ghost"
                size="sm"
                className={`relative group h-12 px-4 bg-gradient-to-r ${action.color} border ${action.borderColor} ${action.textColor} font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm`}
                asChild
              >
                <a href={action.href}>
                  <div className="flex items-center gap-2">
                    <action.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                  
                  {/* Ripple effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  
                  {/* Sparkle effect for AI button */}
                  {action.label === 'Ask AI' && (
                    <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </a>
              </Button>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
