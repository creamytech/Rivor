import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/server/auth';
import { logOAuth } from '@/lib/oauth-logger';

export async function GET(req: NextRequest) {
  try {
    logOAuth('info', '🧪 Testing OAuth provider initialization');
    console.log('🧪 Testing OAuth provider initialization');
    
    // Test the auth configuration
    const providers = authOptions.providers || [];
    const adapter = authOptions.adapter;
    
    logOAuth('info', '📋 Auth configuration check', {
      providerCount: providers.length,
      hasAdapter: !!adapter,
      adapterType: adapter ? (typeof adapter.linkAccount === 'function' ? 'custom' : 'default') : 'none',
      sessionStrategy: authOptions.session?.strategy || 'jwt',
      debug: authOptions.debug
    });
    
    // Test each provider
    const providerTests = providers.map((provider: any) => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      hasOptions: !!provider.options,
      hasClientId: !!(provider.options?.clientId || provider.clientId),
      hasClientSecret: !!(provider.options?.clientSecret || provider.clientSecret)
    }));
    
    logOAuth('info', '🔍 Provider details', { providers: providerTests });
    
    return NextResponse.json({
      success: true,
      providers: providerTests,
      adapter: {
        present: !!adapter,
        type: adapter ? (typeof adapter.linkAccount === 'function' ? 'custom' : 'default') : 'none'
      },
      config: {
        sessionStrategy: authOptions.session?.strategy || 'jwt',
        debug: authOptions.debug,
        hasSecret: !!authOptions.secret,
        pages: authOptions.pages
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logOAuth('error', '❌ Provider test failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}