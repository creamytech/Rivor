import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

// Store active connections for real-time updates
const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orgId = (session as { orgId?: string }).orgId;
  if (!orgId) {
    return new Response('No organization found', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `${orgId}-${Date.now()}`;
      connections.set(connectionId, controller);
      
      // Send initial connection acknowledgment
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
      
      // Cleanup on disconnect
      req.signal?.addEventListener('abort', () => {
        connections.delete(connectionId);
        try {
          controller.close();
        } catch (e) {
          // Controller might already be closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Function to broadcast inbox updates to all connected clients for an org
export async function broadcastInboxUpdate(orgId: string, update: {
  type: 'new_thread' | 'thread_updated' | 'thread_deleted';
  threadId: string;
  threadData?: any;
}) {
  const message = `data: ${JSON.stringify({ ...update, timestamp: new Date().toISOString() })}\n\n`;
  
  for (const [connectionId, controller] of connections.entries()) {
    if (connectionId.startsWith(orgId)) {
      try {
        controller.enqueue(message);
      } catch (error) {
        // Connection might be closed, remove it
        connections.delete(connectionId);
      }
    }
  }
}