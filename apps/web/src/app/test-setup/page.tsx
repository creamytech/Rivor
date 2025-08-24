'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestSetupPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const cleanupAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/cleanup-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const setupAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/setup-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Setup Email & Calendar Accounts</h1>
        
        <Button 
          onClick={cleanupAccounts} 
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          {loading ? 'Cleaning up...' : 'Cleanup Existing Accounts'}
        </Button>

        <Button 
          onClick={setupAccounts} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Setting up...' : 'Setup Email & Calendar Accounts'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}