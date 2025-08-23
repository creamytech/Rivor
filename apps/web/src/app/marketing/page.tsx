"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ArrowRight,
  Check,
  Star,
  Zap,
  Shield,
  Users,
  BarChart3,
  MessageSquare,
  Calendar,
  Home,
  Mail,
  Phone,
  Target,
  Sparkles,
  Globe,
  Lock,
  TrendingUp,
  Award,
  ChevronRight,
  Play,
  X
} from 'lucide-react';

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  gradient: string;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  rating: number;
}

export default function MarketingPage() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const features: FeatureCard[] = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Smart Communication Hub",
      description: "Centralized email, SMS, and calendar management with AI-powered insights and automation",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Advanced Pipeline Analytics",
      description: "Real-time deal tracking, performance metrics, and predictive analytics for better conversions",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Contact & Lead Management",
      description: "Intelligent contact organization with automated lead scoring and nurturing workflows",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Seamless Integrations",
      description: "Connect with Google Workspace, Outlook, and 50+ real estate tools for unified workflow",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Bank-level encryption, GDPR compliance, and advanced security features for data protection",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI-Powered Automation",
      description: "Smart templates, automated follow-ups, and intelligent task prioritization",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  const pricingTiers: PricingTier[] = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for individual agents starting their journey",
      gradient: "from-gray-500 to-slate-500",
      features: [
        "Up to 500 contacts",
        "Email & SMS integration",
        "Basic pipeline management",
        "Calendar sync",
        "Mobile app access",
        "Community support"
      ]
    },
    {
      name: "Professional",
      price: "$59",
      period: "/month",
      description: "Ideal for growing teams and established agents",
      gradient: "from-blue-500 to-purple-500",
      popular: true,
      features: [
        "Unlimited contacts",
        "Advanced analytics",
        "Team collaboration",
        "Custom automations",
        "Priority support",
        "Advanced integrations",
        "Document management",
        "Lead scoring"
      ]
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For large teams and brokerages requiring advanced features",
      gradient: "from-purple-500 to-pink-500",
      features: [
        "Everything in Professional",
        "White-label options",
        "Advanced security",
        "Custom integrations",
        "Dedicated account manager",
        "Training & onboarding",
        "Custom reporting",
        "API access"
      ]
    }
  ];

  const testimonials: Testimonial[] = [
    {
      name: "Sarah Johnson",
      role: "Top Producer",
      company: "Century 21",
      content: "Rivor transformed how I manage my clients. The liquid glass interface is beautiful and the automation features saved me 10 hours per week.",
      avatar: "SJ",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Broker Owner",
      company: "Chen Realty Group",
      content: "Our team productivity increased by 40% after switching to Rivor. The analytics and pipeline management are game-changers.",
      avatar: "MC",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Luxury Agent",
      company: "Sotheby's International",
      content: "The client communication tools and beautiful interface help me maintain the premium experience my luxury clients expect.",
      avatar: "ER",
      rating: 5
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle waitlist submission
    console.log('Waitlist submission:', email);
    setEmail('');
  };

  return (
    <div className={`min-h-screen ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 glass-orb opacity-20"
              style={{
                background: 'var(--glass-gradient)',
                borderRadius: '50%',
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                delay: Math.random() * 10,
              }}
              initial={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 glass-card border-b glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--glass-text)' }}>
                Rivor
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium" style={{ color: 'var(--glass-text-secondary)' }}>
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium" style={{ color: 'var(--glass-text-secondary)' }}>
                Pricing
              </a>
              <a href="#testimonials" className="text-sm font-medium" style={{ color: 'var(--glass-text-secondary)' }}>
                Reviews
              </a>
              <Button variant="liquid" size="sm">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 glass-badge">
              <Sparkles className="w-4 h-4 mr-2" />
              Now with AI-Powered SMS
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 glass-heading">
              Real Estate CRM
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--glass-text-secondary)' }}>
              Experience the future of real estate management with our revolutionary liquid glass interface. 
              Streamline your workflow, boost productivity, and close more deals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button 
                size="lg" 
                className="glass-button-primary"
                onClick={() => setShowVideoModal(true)}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
              <Button variant="outline" size="lg" className="glass-button-secondary">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm" style={{ color: 'var(--glass-text-muted)' }}>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-400" />
                Free 14-day trial
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-400" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Visual */}
        <motion.div
          className="max-w-5xl mx-auto mt-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="relative glass-card p-2 rounded-2xl">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center">
              <Button
                variant="ghost"
                size="lg"
                className="bg-white/10 hover:bg-white/20 rounded-full h-16 w-16 p-0"
                onClick={() => setShowVideoModal(true)}
              >
                <Play className="h-8 w-8 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 glass-heading">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--glass-text-secondary)' }}>
              Powerful features designed specifically for modern real estate professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="glass-card p-6 glass-hover-tilt"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--glass-text)' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--glass-text-secondary)' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 glass-heading">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--glass-text-secondary)' }}>
              Choose the perfect plan for your business. All plans include our core features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                className={`glass-card p-8 text-center glass-hover-tilt relative ${
                  tier.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                    Most Popular
                  </Badge>
                )}
                
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${tier.gradient} flex items-center justify-center`}>
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--glass-text)' }}>
                  {tier.name}
                </h3>
                <p className="mb-4" style={{ color: 'var(--glass-text-secondary)' }}>
                  {tier.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold" style={{ color: 'var(--glass-text)' }}>
                    {tier.price}
                  </span>
                  <span style={{ color: 'var(--glass-text-muted)' }}>
                    {tier.period}
                  </span>
                </div>
                
                <ul className="space-y-3 mb-8 text-left">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: 'var(--glass-text-secondary)' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full glass-button ${
                    tier.popular ? 'glass-button-primary' : 'glass-button-secondary'
                  }`}
                  size="lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 glass-heading">
              Loved by Real Estate Professionals
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--glass-text-secondary)' }}>
              See what industry leaders are saying about Rivor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="glass-card p-6 glass-hover-tilt"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="mb-6 italic" style={{ color: 'var(--glass-text-secondary)' }}>
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--glass-text)' }}>
                      {testimonial.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="glass-card p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 glass-heading">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl mb-8" style={{ color: 'var(--glass-text-secondary)' }}>
              Join thousands of successful agents who've already made the switch
            </p>
            
            <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto mb-6">
              <div className="flex gap-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 glass-input"
                  required
                />
                <Button type="submit" className="glass-button-primary">
                  Get Started
                </Button>
              </div>
            </form>
            
            <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
              Start your free 14-day trial. No credit card required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t glass-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold" style={{ color: 'var(--glass-text)' }}>
                  Rivor
                </span>
              </div>
              <p style={{ color: 'var(--glass-text-secondary)' }}>
                The future of real estate CRM is here.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--glass-text)' }}>
                Product
              </h3>
              <ul className="space-y-2">
                <li><a href="#" style={{ color: 'var(--glass-text-secondary)' }}>Features</a></li>
                <li><a href="#" style={{ color: 'var(--glass-text-secondary)' }}>Pricing</a></li>
                <li><a href="#" style={{ color: 'var(--glass-text-secondary)' }}>Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--glass-text)' }}>
                Company
              </h3>
              <ul className="space-y-2">
                <li><a href="#" style={{ color: 'var(--glass-text-secondary)' }}>About</a></li>
                <li><a href="#" style={{ color: 'var(--glass-text-secondary)' }}>Blog</a></li>
                <li><a href="#" style={{ color: 'var(--glass-text-secondary)' }}>Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--glass-text)' }}>
                Support
              </h3>
              <ul className="space-y-2">
                <li><a href="#" style={{ color: 'var(--glass-text-secondary)' }}>Help Center</a></li>
                <li><a href="#" style={{ color: 'var(--glass-text-secondary)' }}>Contact</a></li>
                <li><a href="#" style={{ color: 'var(--glass-text-secondary)' }}>Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t glass-border pt-8 mt-8 text-center">
            <p style={{ color: 'var(--glass-text-muted)' }}>
              © 2024 Rivor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-modal w-full max-w-4xl mx-4 aspect-video rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 glass-button-secondary"
                  onClick={() => setShowVideoModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <Play className="h-16 w-16 mx-auto mb-4 text-white/60" />
                  <p style={{ color: 'var(--glass-text-muted)' }}>
                    Demo video would be embedded here
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}