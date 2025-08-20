"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does Rivor access my emails?',
      answer: 'Rivor uses OAuth 2.0 to securely connect to your Gmail or Outlook account. You can revoke access anytime, and we only read emails you explicitly grant permission for. Your credentials are never stored.'
    },
    {
      question: 'What email providers does Rivor support?',
      answer: 'Currently we support Gmail and Outlook/Office 365. Support for other providers like Apple Mail and Yahoo is coming soon. All connections use industry-standard OAuth for maximum security.'
    },
    {
      question: 'Can I control what Rivor sees?',
      answer: 'Absolutely. You have granular control over which folders, labels, and timeframes Rivor can analyze. You can exclude personal emails, specific senders, or any content you want to keep private.'
    },
    {
      question: 'How accurate is the AI scoring?',
      answer: 'Our AI models are trained specifically on real estate communication patterns and achieve 90%+ accuracy in identifying qualified leads. The system learns from your feedback to improve over time.'
    },
    {
      question: 'Does Rivor work with my existing CRM?',
      answer: 'Yes! Rivor integrates with popular real estate CRMs including Chime, Follow Up Boss, and KVCore. We can also sync with most CRMs via Zapier or custom API integrations.'
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'You own your data completely. If you cancel, you can export all your data in standard formats. We permanently delete your data within 30 days of cancellation, or immediately upon request.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All plans come with a 14-day free trial. No credit card required to start. You can test all features with your real email data to see how Rivor works for your business.'
    },
    {
      question: 'How much does Rivor cost?',
      answer: 'Rivor starts at $49/month for individual agents. Team plans start at $39/month per user. We offer annual discounts and custom pricing for large brokerages. All plans include unlimited email processing.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="max-w-[800px] mx-auto px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
            Frequently asked questions
          </h2>
          <p className="text-base md:text-lg text-[#9CB3D9]">
            Everything you need to know about Rivor
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/5"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-medium text-[#EAF2FF] pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="h-5 w-5 text-[#9CB3D9]" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-white/5">
                      <p className="text-[#9CB3D9] leading-relaxed pt-4">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}