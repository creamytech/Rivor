'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SyncResult {
  success: boolean;
  message?: string;
  accountsProcessed?: number;
  results?: Array<{
    accountId: string;
    provider: string;
    status: string;
    error?: string;
  }>;
  error?: string;
}

export default function SyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sync/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: SyncResult = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed');
      }

      if (result.success) {
        setLastSync(new Date());
        // Refresh the page to show new data
        router.refresh();
      } else {
        throw new Error(result.error || 'Sync failed');
      }

    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'Failed to sync emails');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={handleSync}
          disabled={isLoading}
          className={`
            px-3 py-1 text-sm rounded border transition-colors
            ${isLoading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Syncing...
            </span>
          ) : (
            '🔄 Sync Emails'
          )}
        </button>

        {lastSync && (
          <span className="text-xs text-gray-500">
            Last sync: {lastSync.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
