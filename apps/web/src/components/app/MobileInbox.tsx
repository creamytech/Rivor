"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MailOpen,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Circle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface MobileInboxProps {
  className?: string;
}

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  time: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  isPriority: boolean;
  labels: string[];
}

export default function MobileInbox({ className }: MobileInboxProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading emails
    const loadEmails = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setEmails([
        {
          id: '1',
          from: 'Sarah Johnson',
          fromEmail: 'sarah@email.com',
          subject: 'Property Investment Inquiry - Downtown Location',
          preview: 'Hi there, I\'m interested in the downtown property listing you sent me. Could we schedule a viewing for this week?',
          time: '10:30 AM',
          isRead: false,
          isStarred: true,
          hasAttachment: false,
          isPriority: true,
          labels: ['Hot Lead']
        },
        {
          id: '2',
          from: 'Michael Chen',
          fromEmail: 'mchen@business.com',
          subject: 'Re: Commercial Property Proposal',
          preview: 'Thank you for the detailed proposal. I have a few questions about the financing options...',
          time: '9:15 AM',
          isRead: true,
          isStarred: false,
          hasAttachment: true,
          isPriority: false,
          labels: ['Commercial']
        },
        {
          id: '3',
          from: 'Emma Rodriguez',
          fromEmail: 'emma.r@email.com',
          subject: 'Family Home Search - Urgent',
          preview: 'Hi! My family and I are looking to move by the end of the month. Do you have any 3-bedroom homes available?',
          time: 'Yesterday',
          isRead: false,
          isStarred: false,
          hasAttachment: false,
          isPriority: true,
          labels: ['Residential', 'Urgent']
        },
        {
          id: '4',
          from: 'David Kim',
          fromEmail: 'dkim@company.co',
          subject: 'Contract Signed - Next Steps',
          preview: 'The contract has been signed and submitted. What are the next steps in the process?',
          time: 'Yesterday',
          isRead: true,
          isStarred: true,
          hasAttachment: true,
          isPriority: false,
          labels: ['Contract']
        },
        {
          id: '5',
          from: 'Lisa Wang',
          fromEmail: 'lisa.w@email.com',
          subject: 'Market Analysis Request',
          preview: 'Could you provide a market analysis for the Maple Street area? I\'m considering an investment...',
          time: '2 days ago',
          isRead: true,
          isStarred: false,
          hasAttachment: false,
          isPriority: false,
          labels: ['Analysis']
        }
      ]);
      
      setLoading(false);
    };

    loadEmails();
  }, []);

  const filteredEmails = emails.filter(email => {
    if (filter === 'unread' && email.isRead) return false;
    if (filter === 'starred' && !email.isStarred) return false;
    if (searchQuery && !email.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !email.from.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleStar = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
    ));
  };

  const markAsRead = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, isRead: true } : email
    ));
  };

  if (loading) {
    return (
      <div className={`p-4 space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (selectedEmail) {
    return (
      <motion.div 
        className={`h-full flex flex-col ${className}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Email Header */}
        <div 
          className="p-4 border-b"
          style={{
            backgroundColor: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedEmail(null)}
              className="glass-button"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--glass-text)' }}>
                {selectedEmail.subject}
              </h2>
              <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                {selectedEmail.from} • {selectedEmail.time}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleStar(selectedEmail.id)}
              className="glass-button"
            >
              <Star className={`h-4 w-4 ${selectedEmail.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 glass-button">
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
            <Button variant="outline" size="sm" className="glass-button">
              <Forward className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="glass-button">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="glass-button text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-auto p-4">
          <div 
            className="p-4 rounded-xl"
            style={{
              backgroundColor: 'var(--glass-surface)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                {selectedEmail.from.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>
                  {selectedEmail.from}
                </p>
                <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                  {selectedEmail.fromEmail}
                </p>
              </div>
              <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                {selectedEmail.time}
              </span>
            </div>
            
            <div className="space-y-4">
              <p style={{ color: 'var(--glass-text)' }}>
                {selectedEmail.preview}
              </p>
              <p style={{ color: 'var(--glass-text)' }}>
                I've reviewed the property details and I'm very interested. The location seems perfect for what I'm looking for. 
                Could we arrange a viewing sometime this week? I'm available Tuesday through Thursday afternoons.
              </p>
              <p style={{ color: 'var(--glass-text)' }}>
                Also, could you provide more information about the neighborhood amenities and local schools?
              </p>
              <p style={{ color: 'var(--glass-text)' }}>
                Looking forward to hearing from you.
              </p>
              <p style={{ color: 'var(--glass-text)' }}>
                Best regards,<br />
                {selectedEmail.from}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`p-4 space-y-4 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--glass-text-muted)' }} />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                backgroundColor: 'var(--glass-surface)',
                border: '1px solid var(--glass-border)',
                color: 'var(--glass-text)'
              }}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="glass-button"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'starred', label: 'Starred' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.key as any)}
              className="text-xs"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Compose Button */}
      <Button 
        className="w-full justify-start gap-3"
        style={{
          backgroundColor: 'var(--glass-primary)',
          color: 'var(--glass-primary-foreground)'
        }}
      >
        <Plus className="h-4 w-4" />
        Compose Email
      </Button>

      {/* Email List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredEmails.map((email, index) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                markAsRead(email.id);
                setSelectedEmail(email);
              }}
              className="p-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--glass-surface)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div className="flex items-start gap-3">
                {/* Read Status & Avatar */}
                <div className="flex flex-col items-center gap-2">
                  {!email.isRead && (
                    <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {email.from.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>

                {/* Email Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium text-sm truncate ${!email.isRead ? 'font-semibold' : ''}`} style={{ color: 'var(--glass-text)' }}>
                      {email.from}
                    </p>
                    <div className="flex items-center gap-2">
                      {email.hasAttachment && <Paperclip className="h-3 w-3" style={{ color: 'var(--glass-text-muted)' }} />}
                      {email.isPriority && <Circle className="h-2 w-2 fill-red-500 text-red-500" />}
                      <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                        {email.time}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-2 truncate ${!email.isRead ? 'font-medium' : ''}`} style={{ color: 'var(--glass-text)' }}>
                    {email.subject}
                  </p>
                  
                  <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--glass-text-muted)' }}>
                    {email.preview}
                  </p>
                  
                  {/* Labels */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 flex-wrap">
                      {email.labels.map((label) => (
                        <Badge
                          key={label}
                          className="text-xs"
                          style={{
                            backgroundColor: 'var(--glass-primary-muted)',
                            color: 'var(--glass-primary)'
                          }}
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(email.id);
                      }}
                    >
                      <Star className={`h-3 w-3 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredEmails.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--glass-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
            {searchQuery ? 'No emails found' : 'No emails to display'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}