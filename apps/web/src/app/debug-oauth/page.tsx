'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function PublicOAuthDebugPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fixOAuth = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/fix-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/oauth-config');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const checkAuthLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/auth-logs');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/test-db');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-center">OAuth Debug Tool</CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Fix "OAuthAccountNotLinked" authentication errors
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Your Google Email Address:
            </label>
            <Input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="benjaminscott18@gmail.com"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={fixOAuth} 
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Fixing...' : 'Fix OAuth Error'}
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                onClick={checkAuthStatus} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? 'Checking...' : 'Config'}
              </Button>
              <Button 
                onClick={testDatabase} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? 'Testing...' : 'Test DB'}
              </Button>
              <Button 
                onClick={checkAuthLogs} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? 'Loading...' : 'Logs'}
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Step 1:</strong> Enter your email and click "Fix OAuth Error"</p>
            <p><strong>Step 2:</strong> Try signing in with Google again</p>
            <p><strong>Step 3:</strong> If successful, you can access the app normally</p>
          </div>

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Result:</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="text-center pt-4">
            <a 
              href="/auth/signin" 
              className="text-blue-600 hover:underline text-sm"
            >
              Try signing in again →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}