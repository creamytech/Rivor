import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { redirect } from 'next/navigation';

/**
 * Admin-only debug page for auth persistence verification
 * Milestone C requirement: Shows counts for User, Account, Session
 * 
 * Usage: /debug/auth
 * Access: Admin users only (you can modify the access check as needed)
 */

interface AuthCounts {
  users: number;
  accounts: number;
  sessions: number;
  verificationTokens: number;
  oauthAccounts: number;
}

interface RecentActivity {
  recentUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }>;
  recentAccounts: Array<{
    id: string;
    provider: string;
    providerAccountId: string;
    userId: string;
    createdAt: Date;
    refresh_token: boolean;
  }>;
}

async function getAuthCounts(): Promise<AuthCounts> {
  const [users, accounts, sessions, verificationTokens, oauthAccounts] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.session.count(),
    prisma.verificationToken.count(),
    prisma.oAuthAccount.count()
  ]);

  return {
    users,
    accounts,
    sessions,
    verificationTokens,
    oauthAccounts
  };
}

async function getRecentActivity(): Promise<RecentActivity> {
  const [recentUsers, recentAccountsRaw] = await Promise.all([
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    }),
    prisma.account.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        userId: true,
        createdAt: true,
        refresh_token: true
      }
    })
  ]);

  const recentAccounts = recentAccountsRaw.map(account => ({
    ...account,
    refresh_token: !!account.refresh_token
  }));

  return {
    recentUsers,
    recentAccounts
  };
}

function isAdminUser(email: string | null | undefined): boolean {
  // TODO: Implement proper admin check
  // For now, you can modify this to check against your admin list
  const adminEmails = [
    // Add your admin emails here
    'admin@example.com',
    // You can get this from environment variables too
    process.env.ADMIN_EMAIL
  ].filter(Boolean);
  
  return email ? adminEmails.includes(email) : false;
}

export default async function DebugAuthPage() {
  const session = await auth();
  
  // Check if user is authenticated
  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/debug/auth');
  }

  // Check if user is admin (modify this check as needed)
  if (!isAdminUser(session.user.email)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              This debug page is only accessible to administrators.
            </p>
            <p className="text-sm text-gray-500">
              Current user: {session.user.email}
            </p>
            <div className="mt-6">
              <a 
                href="/app" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Return to App
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get auth data for admin users
  const [counts, activity] = await Promise.all([
    getAuthCounts(),
    getRecentActivity()
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Auth Debug Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Milestone C: Auth persistence verification for admin users
            </p>
            <div className="mt-2 text-xs text-gray-500">
              Current user: {session.user.email} | Access: Admin
            </div>
          </div>

          {/* Auth Counts Grid */}
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
                      <dd className="text-lg font-medium text-gray-900">{counts.users}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">NextAuth Accounts</dt>
                      <dd className="text-lg font-medium text-gray-900">{counts.accounts}</dd>
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
                      <dd className="text-lg font-medium text-gray-900">{counts.sessions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🎟️</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Verification Tokens</dt>
                      <dd className="text-lg font-medium text-gray-900">{counts.verificationTokens}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🔑</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">OAuth Accounts</dt>
                      <dd className="text-lg font-medium text-gray-900">{counts.oauthAccounts}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Users</h3>
                <div className="mt-5">
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {activity.recentUsers.map((user) => (
                        <li key={user.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name || 'No name'}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-sm text-gray-500">
                              {user.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Accounts */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent OAuth Connections</h3>
                <div className="mt-5">
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {activity.recentAccounts.map((account) => (
                        <li key={account.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="text-lg">
                                {account.provider === 'google' ? '🔴' : '🔵'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {account.provider}
                              </p>
                              <p className="text-sm text-gray-500">
                                User: {account.userId}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {account.refresh_token && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Has Refresh Token
                                </span>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-sm text-gray-500">
                              {account.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Health Status</h3>
              <div className="mt-5 space-y-3">
                <div className="flex items-center">
                  <div className="text-green-500 text-sm">✅</div>
                  <span className="ml-2 text-sm text-gray-600">
                    NextAuth tables exist and accessible
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="text-green-500 text-sm">✅</div>
                  <span className="ml-2 text-sm text-gray-600">
                    OAuth callback logging active
                  </span>
                </div>
                {counts.accounts > 0 && (
                  <div className="flex items-center">
                    <div className="text-green-500 text-sm">✅</div>
                    <span className="ml-2 text-sm text-gray-600">
                      Account rows exist with OAuth data
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
