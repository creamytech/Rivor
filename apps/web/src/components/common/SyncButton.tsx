"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncButtonProps {
  type: 'email' | 'calendar';
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  onSyncComplete?: (result: any) => void;
}

export default function SyncButton({ 
  type, 
  className, 
  variant = 'outline',
  size = 'sm',
  onSyncComplete 
}: SyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSync = async () => {
    setIsLoading(true);
    setStatus('idle');

    try {
      const endpoint = type === 'email' ? '/api/debug/sync-email' : '/api/debug/sync-calendar';
      const response = await fetch(endpoint, { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        setStatus('success');
        onSyncComplete?.(result);
        
        // Reset status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        console.error(`${type} sync failed:`, result.message);
      }
    } catch (error) {
      setStatus('error');
      console.error(`${type} sync error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getText = () => {
    if (isLoading) {
      return `Syncing ${type}...`;
    }
    
    switch (status) {
      case 'success':
        return `${type} synced!`;
      case 'error':
        return `Sync failed`;
      default:
        return `Sync ${type}`;
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={cn(
        'transition-all duration-200',
        status === 'success' && 'border-green-500 text-green-600',
        status === 'error' && 'border-red-500 text-red-600',
        className
      )}
    >
      {getIcon()}
      <span className="ml-2">{getText()}</span>
    </Button>
  );
}
