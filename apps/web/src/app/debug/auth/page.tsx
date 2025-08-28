"use client";

import { useState } from 'react';

interface DebugData {
  stats?: {
    totalUsers: number;
    totalOrganizations: number;
    totalOrgMembers: number;
    totalAccounts: number;
    totalSessions: number;
  };
  problem?: {
    description: string;
    orphanedUsersCount: number;
    orphanedUsers: any[];
  };
  recentAccountCreations?: any[];
  diagnosis?: string;
  usersWithoutOrgs?: any[];
}

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  results?: any;
}

export default function DebugAuthPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const [publicDebugRes, manualOnboardingRes] = await Promise.all([
        fetch('/api/debug/public-auth-debug'),
        fetch('/api/debug/manual-onboarding')
      ]);
      
      const publicData = await publicDebugRes.json();
      const manualData = await manualOnboardingRes.json();
      
      setDebugData({
        ...publicData,
        usersWithoutOrgs: manualData.usersWithoutOrgs
      });
    } catch (error) {
      console.error('Failed to fetch debug data:', error);
      setActionResults(prev => [...prev, {
        success: false,
        error: 'Failed to fetch debug data: ' + (error as Error).message
      }]);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action: string, email?: string) => {
    setLoading(true);
    try {
      let url = '';
      let body: any = { action };
      
      if (action === 'cleanup_orphans') {
        url = '/api/debug/public-auth-debug';
      } else if (action === 'manual_onboarding' && email) {
        url = '/api/debug/manual-onboarding';
        body = { userEmail: email, authorization: 'EMERGENCY_CLEANUP' };
      } else if (action === 'test_onboarding') {
        url = '/api/debug/public-auth-debug';
        body = { action: 'test_onboarding', email: email || 'test@example.com' };
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      setActionResults(prev => [...prev, {
        success: result.success || response.ok,
        message: result.message || result.result,
        error: result.error,
        results: result.results || result.onboardingResult
      }]);
      
      // Refresh data after action
      await fetchDebugData();
    } catch (error) {
      setActionResults(prev => [...prev, {
        success: false,
        error: 'Action failed: ' + (error as Error).message
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🔧 Auth Debug Center</h1>
            <p className="mt-2 text-sm text-gray-600">
              Comprehensive debugging tools for OAuth authentication issues - No authentication required
            </p>
            <div className="mt-4">
              <button
                onClick={fetchDebugData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '🔄 Loading...' : '🔍 Fetch Debug Data'}
              </button>
            </div>
          </div>

          {/* Action Results */}
          {actionResults.length > 0 && (
            <div className="mb-8 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Action Results</h3>
              <div className="space-y-3">
                {actionResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="text-lg mr-2">
                        {result.success ? '✅' : '❌'}
                      </div>
                      <div className="flex-1">
                        {result.message && (
                          <p className={`font-medium ${
                            result.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {result.message}
                          </p>
                        )}
                        {result.error && (
                          <p className="text-red-600 text-sm mt-1">{result.error}</p>
                        )}
                        {result.results && (
                          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                            {JSON.stringify(result.results, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setActionResults([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Results
                </button>
              </div>
            </div>
          )}

          {debugData && (
            <>
              {/* System Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-2xl">👤</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Users</dt>
                          <dd className="text-lg font-medium text-gray-900">{debugData.stats?.totalUsers || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-2xl">🏢</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Organizations</dt>
                          <dd className="text-lg font-medium text-gray-900">{debugData.stats?.totalOrganizations || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-2xl">🔗</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Accounts</dt>
                          <dd className="text-lg font-medium text-gray-900">{debugData.stats?.totalAccounts || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-2xl">🔒</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Sessions</dt>
                          <dd className="text-lg font-medium text-gray-900">{debugData.stats?.totalSessions || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-2xl">👥</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Org Members</dt>
                          <dd className="text-lg font-medium text-gray-900">{debugData.stats?.totalOrgMembers || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="mb-8">
                <div className={`p-4 rounded-lg border ${
                  debugData.diagnosis?.includes('PROBLEM') 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">
                      {debugData.diagnosis?.includes('PROBLEM') ? '🚨' : '✅'}
                    </div>
                    <div>
                      <h3 className={`font-medium ${
                        debugData.diagnosis?.includes('PROBLEM') ? 'text-red-800' : 'text-green-800'
                      }`}>
                        System Diagnosis
                      </h3>
                      <p className={`text-sm mt-1 ${
                        debugData.diagnosis?.includes('PROBLEM') ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {debugData.diagnosis}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Debug Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🧹 Cleanup Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => runAction('cleanup_orphans')}
                      disabled={loading}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Clean Up Orphaned Users
                    </button>
                    <p className="text-sm text-gray-600">
                      Removes users without organizations (orphaned users: {debugData.problem?.orphanedUsersCount || 0})
                    </p>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🔧 Manual Onboarding</h3>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={selectedEmail}
                      onChange={(e) => setSelectedEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => runAction('manual_onboarding', selectedEmail)}
                      disabled={loading || !selectedEmail}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Trigger Manual Onboarding
                    </button>
                    <p className="text-sm text-gray-600">
                      Manually run onboarding for a specific user
                    </p>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🧪 System Tests</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => runAction('test_onboarding')}
                      disabled={loading}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Test Onboarding System
                    </button>
                    <p className="text-sm text-gray-600">
                      Test if onboarding functions can be imported and called
                    </p>
                  </div>
                </div>
              </div>

              {/* Users Without Organizations */}
              {debugData.usersWithoutOrgs && debugData.usersWithoutOrgs.length > 0 && (
                <div className="bg-white shadow rounded-lg mb-8">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">⚠️ Users Without Organizations</h3>
                    <div className="mt-5">
                      <div className="flow-root">
                        <ul className="-my-5 divide-y divide-gray-200">
                          {debugData.usersWithoutOrgs.map((user: any) => (
                            <li key={user.id} className="py-4">
                              <div className="flex items-center space-x-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {user.name || 'No name'}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {user.email}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Accounts: {user.accounts?.length || 0} | Created: {new Date(user.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <button
                                    onClick={() => runAction('manual_onboarding', user.email)}
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-3 py-1 text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    Fix
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Account Creations */}
              {debugData.recentAccountCreations && debugData.recentAccountCreations.length > 0 && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">📅 Recent Account Creations</h3>
                    <div className="mt-5">
                      <div className="flow-root">
                        <ul className="-my-5 divide-y divide-gray-200">
                          {debugData.recentAccountCreations.map((account: any, index: number) => (
                            <li key={index} className="py-4">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="text-lg">
                                    {account.provider === 'google' ? '🔴' : '🔵'}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {account.provider} - {account.user?.email || 'No email'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Org memberships: {account.user?._count?.orgMembers || 0}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(account.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  {account.user?._count?.orgMembers === 0 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Orphaned
                                    </span>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!debugData && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900">No Debug Data</h3>
              <p className="text-gray-500 mb-4">Click "Fetch Debug Data" to load system information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
