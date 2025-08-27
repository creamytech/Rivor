"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Database, 
  Clock, 
  User, 
  Building, 
  Mail, 
  Calendar, 
  Settings, 
  Activity,
  Zap,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Brain,
  Bot
} from 'lucide-react';

interface DebugResult {
  endpoint: string;
  method: string;
  timestamp: string;
  success: boolean;
  data: any;
  error?: string;
  duration?: number;
}

export default function DebugDashboard() {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const executeDebug = async (endpoint: string, method: string = 'GET', description: string, body?: any) => {
    setLoading(endpoint);
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body && { body: JSON.stringify(body) })
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      const result: DebugResult = {
        endpoint,
        method,
        timestamp: new Date().toISOString(),
        success: response.ok,
        data,
        duration
      };
      
      if (!response.ok) {
        result.error = data.error || `HTTP ${response.status}`;
      }
      
      setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: DebugResult = {
        endpoint,
        method,
        timestamp: new Date().toISOString(),
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
        duration
      };
      
      setResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = (result: DebugResult) => {
    const formatted = `=== DEBUG RESULT ===
Endpoint: ${result.method} ${result.endpoint}
Timestamp: ${result.timestamp}
Duration: ${result.duration}ms
Success: ${result.success}
${result.error ? `Error: ${result.error}` : ''}

Data:
${JSON.stringify(result.data, null, 2)}
==================`;
    
    navigator.clipboard.writeText(formatted);
  };

  const debugEndpoints = [
    {
      category: "Authentication & Session",
      icon: User,
      endpoints: [
        {
          name: "Check Current Session",
          description: "Verify current authentication session",
          endpoint: "/api/debug/auth-timing",
          method: "GET"
        },
        {
          name: "Test Session Retrieval",
          description: "Check session retrieval performance",
          endpoint: "/api/debug/minimal-auth-test",
          method: "GET"
        },
        {
          name: "OAuth Token Debug",
          description: "Inspect OAuth token storage and mapping",
          endpoint: "/api/debug/oauth-tokens",
          method: "GET"
        },
        {
          name: "Encrypt Plain Tokens",
          description: "Convert plain OAuth tokens to encrypted format",
          endpoint: "/api/debug/oauth-tokens",
          method: "POST",
          requiresAuth: true,
          body: { encryptPlainTokens: true }
        }
      ]
    },
    {
      category: "Onboarding & Organizations",
      icon: Building,
      endpoints: [
        {
          name: "Check Onboarding Status", 
          description: "View user's org, email accounts, and onboarding state",
          endpoint: "/api/debug/check-onboarding",
          method: "GET"
        },
        {
          name: "Force Run Onboarding",
          description: "Manually trigger the onboarding process",
          endpoint: "/api/debug/force-onboarding", 
          method: "POST"
        },
        {
          name: "Test Org Creation",
          description: "Directly test organization creation",
          endpoint: "/api/debug/test-org-creation",
          method: "POST"
        }
      ]
    },
    {
      category: "Database & Tokens",
      icon: Database,
      endpoints: [
        {
          name: "Check Database Sessions",
          description: "View database session records",
          endpoint: "/api/debug/test-session",
          method: "GET"
        }
      ]
    },
    {
      category: "Email & Calendar Sync",
      icon: Mail,
      endpoints: [
        {
          name: "Email Sync Status",
          description: "Check email synchronization status",
          endpoint: "/api/debug/sync-status",
          method: "GET"
        },
        {
          name: "Auto Sync Status",
          description: "Check auto-sync system status",
          endpoint: "/api/sync/auto",
          method: "GET"
        },
        {
          name: "Force Manual Sync",
          description: "Force immediate sync of email and calendar (tests token refresh)",
          endpoint: "/api/sync/manual",
          method: "POST",
          requiresAuth: true
        },
        {
          name: "Force Auto Sync",
          description: "Trigger auto-sync process",
          endpoint: "/api/sync/auto",
          method: "POST",
          requiresAuth: true
        }
      ]
    },
    {
      category: "AI & Email Analysis", 
      icon: Brain,
      endpoints: [
        {
          name: "AI Configuration Test",
          description: "Check OpenAI API key and configuration",
          endpoint: "/api/debug/test-ai?test=config",
          method: "GET"
        },
        {
          name: "AI Database Test",
          description: "Check database access and user organization",
          endpoint: "/api/debug/test-ai?test=database", 
          method: "GET"
        },
        {
          name: "AI Email Data Test",
          description: "Check email threads and decryption",
          endpoint: "/api/debug/test-ai?test=emails",
          method: "GET"
        },
        {
          name: "OpenAI API Test",
          description: "Direct test of OpenAI API integration",
          endpoint: "/api/debug/test-ai?test=openai",
          method: "GET"
        },
        {
          name: "Full AI Test Suite",
          description: "Run all AI system tests",
          endpoint: "/api/debug/test-ai?test=all",
          method: "GET"
        }
      ]
    },
    {
      category: "System Health",
      icon: Activity,
      endpoints: [
        {
          name: "Overall System Status",
          description: "Comprehensive system health check",
          endpoint: "/api/debug/system-status",
          method: "GET"
        }
      ]
    }
  ];

  const getStatusIcon = (success: boolean, error?: string) => {
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusColor = (success: boolean, error?: string) => {
    if (error) return 'destructive';
    if (success) return 'default';
    return 'secondary';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <Bug className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Debug Dashboard</h1>
              <p className="text-gray-600">Comprehensive system debugging and diagnostics</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Debug Controls */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Debug Controls</h2>
            
            {debugEndpoints.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.endpoints.map((endpoint, endpointIndex) => (
                    <div key={endpointIndex} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{endpoint.name}</div>
                        <div className="text-xs text-gray-500">{endpoint.description}</div>
                        <div className="text-xs font-mono text-gray-400 mt-1">
                          {endpoint.method} {endpoint.endpoint}
                        </div>
                      </div>
                      <Button
                        onClick={() => executeDebug(endpoint.endpoint, endpoint.method, endpoint.description, (endpoint as any).body)}
                        disabled={loading === endpoint.endpoint}
                        size="sm"
                        className="ml-3"
                      >
                        {loading === endpoint.endpoint ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Debug Results</h2>
              <Button
                onClick={() => setResults([])}
                variant="outline"
                size="sm"
                disabled={results.length === 0}
              >
                Clear Results
              </Button>
            </div>

            <div className="space-y-4 max-h-[800px] overflow-y-auto">
              {results.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No debug results yet. Click a debug button to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                results.map((result, index) => (
                  <Card key={index} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono">
                          {result.method} {result.endpoint}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(result.success, result.error)}>
                            {getStatusIcon(result.success, result.error)}
                            {result.success ? 'Success' : 'Failed'}
                          </Badge>
                          <Button
                            onClick={() => copyToClipboard(result)}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {new Date(result.timestamp).toLocaleString()} • {result.duration}ms
                        {result.error && (
                          <div className="text-red-600 mt-1 font-medium">
                            Error: {result.error}
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-80">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common debugging workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  executeDebug("/api/debug/check-onboarding", "GET", "Check onboarding");
                  setTimeout(() => executeDebug("/api/debug/auth-timing", "GET", "Check auth timing"), 1000);
                }}
                variant="outline"
              >
                Quick Status Check
              </Button>
              <Button
                onClick={() => {
                  executeDebug("/api/debug/force-onboarding", "POST", "Force onboarding");
                  setTimeout(() => executeDebug("/api/debug/check-onboarding", "GET", "Verify onboarding"), 2000);
                }}
                variant="outline"
              >
                Fix Missing Org
              </Button>
              <Button
                onClick={() => {
                  executeDebug("/api/debug/test-org-creation", "POST", "Test org creation");
                  setTimeout(() => executeDebug("/api/debug/sync-status", "GET", "Check sync status"), 1000);
                }}
                variant="outline"
              >
                Test & Verify Org
              </Button>
              <Button
                onClick={() => {
                  executeDebug("/api/debug/test-ai?test=config", "GET", "Check AI config");
                  setTimeout(() => executeDebug("/api/debug/test-ai?test=emails", "GET", "Check emails"), 1000);
                  setTimeout(() => executeDebug("/api/debug/test-ai?test=openai", "GET", "Test OpenAI"), 2000);
                }}
                variant="outline"
              >
                <Bot className="h-4 w-4 mr-2" />
                Test AI System
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}