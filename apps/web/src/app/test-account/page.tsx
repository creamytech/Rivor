'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestAccountPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const createAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/create-account', {
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
        <h1 className="text-2xl font-bold text-center">Create Account Record</h1>
        
        <Button 
          onClick={createAccount} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Account Record'}
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