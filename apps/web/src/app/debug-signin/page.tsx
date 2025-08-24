'use client';

import { useState } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugSignInPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testSignIn = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing sign-in...');
      
      // First, get available providers
      const providers = await getProviders();
      console.log('Available providers:', providers);
      
      if (!providers || Object.keys(providers).length === 0) {
        setResult({ error: 'No providers available' });
        return;
      }
      
      // Try to initiate sign-in with Google
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/app'
      });
      
      console.log('Sign-in result:', result);
      setResult(result);
      
    } catch (error) {
      console.error('Sign-in error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const checkConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/signin-test');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/oauth-config');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-center">Sign-In Debug Tool</CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Test OAuth sign-in configuration and flow
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={checkConfig} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Checking...' : 'Check Configuration'}
            </Button>
            
            <Button 
              onClick={checkAuth} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Checking...' : 'Check OAuth Config'}
            </Button>
            
            <Button 
              onClick={testSignIn} 
              disabled={loading}
              variant="default"
            >
              {loading ? 'Testing...' : 'Test Sign-In'}
            </Button>
          </div>

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Result:</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
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
              Try normal sign-in page →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}