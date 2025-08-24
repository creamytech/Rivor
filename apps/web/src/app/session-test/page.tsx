'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SessionTestPage() {
  const { data: session, status, update } = useSession();
  const [sessionEndpoint, setSessionEndpoint] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkSessionEndpoint = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setSessionEndpoint(data);
    } catch (error) {
      console.error('Session endpoint check failed:', error);
    }
  };

  const forceRefresh = async () => {
    setLoading(true);
    try {
      await update(); // Force session refresh
      await checkSessionEndpoint();
    } catch (error) {
      console.error('Force refresh failed:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkSessionEndpoint();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Session Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div>
            <h3 className="font-semibold mb-2">Client Session (useSession hook):</h3>
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>Found:</strong> {session ? 'Yes' : 'No'}</p>
              {session && (
                <>
                  <p><strong>Email:</strong> {session.user?.email}</p>
                  <p><strong>Name:</strong> {session.user?.name}</p>
                  <p><strong>Expires:</strong> {session.expires}</p>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Session Endpoint Response:</h3>
            <div className="bg-gray-100 p-4 rounded">
              <pre className="text-xs overflow-auto">
                {sessionEndpoint ? JSON.stringify(sessionEndpoint, null, 2) : 'Loading...'}
              </pre>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={forceRefresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Force Refresh Session'}
            </Button>
            <Button onClick={checkSessionEndpoint}>
              Check Session Endpoint
            </Button>
            {!session && (
              <Button onClick={() => signIn('google')}>
                Sign In with Google
              </Button>
            )}
            {session && (
              <Button variant="destructive" onClick={() => signOut()}>
                Sign Out
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Diagnosis:</strong></p>
            <p>• If session endpoint has data but useSession is empty, it's a client sync issue</p>
            <p>• If both are empty, the session endpoint isn't working</p>
            <p>• If both have data, everything is working correctly</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}