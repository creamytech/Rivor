"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Twitter, Linkedin, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  email: string;
  firstName: string;
  role: string;
  note: string;
  consent: boolean;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    role: '',
    note: '',
    consent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitError, setSubmitError] = useState('');

  // Force dark theme for modal
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Add dark theme data attribute to modal elements
      const modal = document.querySelector('[data-radix-dialog-content]');
      if (modal) {
        modal.setAttribute('data-glass-theme', 'black');
        (modal as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        (modal as HTMLElement).style.color = '#ffffff';
      }
    }
  }, [isOpen]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.consent) {
      newErrors.consent = 'Please agree to receive updates';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    // Fire analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'waitlist_submitted', {
        email: formData.email,
        role: formData.role || 'not_specified',
        source: 'marketing',
      });
    }

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'marketing',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        
        // Fire success analytics event
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'waitlist_success', {
            email: formData.email,
            role: formData.role || 'not_specified',
            source: 'marketing',
          });
        }
      } else {
        if (response.status === 409) {
          setSubmitError('This email is already on our waitlist!');
        } else {
          setSubmitError(data.error || 'Something went wrong. Please try again.');
        }
      }
    } catch (error) {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      firstName: '',
      role: '',
      note: '',
      consent: false,
    });
    setErrors({});
    setSubmitError('');
    setIsSuccess(false);
    onClose();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const shareTwitter = () => {
    const text = "Just joined the @Rivor waitlist! 🏠 AI-powered real estate workspace that turns inbox chaos into deal flow.";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareLinkedIn = () => {
    const text = "Just joined the Rivor waitlist! AI-powered real estate workspace.";
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto glass-modal glass-border-active glass-hover-glow bg-black/95 backdrop-blur-xl border border-white/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {isSuccess ? "You're in!" : "Join the Rivor waitlist"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 text-center"
            >
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">You're in!</h3>
                <p className="text-white/80">
                  We'll email you soon with early access updates.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-white/70">Share the word:</p>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    className="border-white/20 hover:border-white/40 bg-transparent"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareTwitter}
                    className="border-white/20 hover:border-white/40 bg-transparent"
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareLinkedIn}
                    className="border-white/20 hover:border-white/40 bg-transparent"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black/80 border-white/30 focus:border-cyan-400 text-white"
                  placeholder="you@company.com"
                  required
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-400" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-black/80 border-white/30 focus:border-cyan-400 text-white"
                  placeholder="Your first name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-black/80 border-white/30 focus:border-cyan-400 text-white">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/30">
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium">
                  What's your biggest pain with email/pipeline?
                </Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="bg-[#0E1420] border-white/20 focus:border-[#16C4D9] text-[#EAF2FF] min-h-[80px]"
                  placeholder="Tell us about your workflow challenges..."
                />
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-1 h-4 w-4 text-cyan-400 bg-black/80 border-white/30 rounded focus:ring-cyan-400 focus:ring-2"
                  required
                  aria-describedby={errors.consent ? "consent-error" : undefined}
                />
                <Label htmlFor="consent" className="text-sm text-white/80 leading-5">
                  Email me about early access and product updates
                </Label>
              </div>
              {errors.consent && (
                <p id="consent-error" className="text-sm text-red-400 ml-7" role="alert">
                  {errors.consent}
                </p>
              )}

              {submitError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400" role="alert">{submitError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl px-5 py-3 font-medium text-white bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:opacity-95 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}