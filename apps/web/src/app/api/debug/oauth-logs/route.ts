import { NextRequest, NextResponse } from 'next/server';
import { getOAuthLogs, clearOAuthLogs } from '@/lib/oauth-logger';

export async function GET(req: NextRequest) {
  try {
    const logs = getOAuthLogs();
    
    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    clearOAuthLogs();
    
    return NextResponse.json({
      success: true,
      message: 'OAuth logs cleared',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}