"use client";

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SMSWidget from './SMSWidget';

interface SMSFloatingButtonProps {
  className?: string;
  initialContactId?: string;
  unreadCount?: number;
}

export default function SMSFloatingButton({ 
  className = '', 
  initialContactId,
  unreadCount = 0 
}: SMSFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SMSWidget 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        initialContactId={initialContactId}
        className={className}
      />
      
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-24 rounded-full h-12 w-12 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-600 dark:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 text-white transition-all duration-300 z-40 ${className}`}
          aria-label="Open SMS chat"
        >
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-3 -right-3 h-5 w-5 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </Button>
      )}
    </>
  );
}