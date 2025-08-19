import { notificationEmitter } from '@/server/notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let send: (data: unknown) => void;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      send = (notification) => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              timestamp: notification.createdAt.toISOString(),
              isRead: notification.isRead,
              priority: notification.priority,
            })}\n\n`,
          ),
        );
      };
      notificationEmitter.on('notification', send);
    },
    cancel() {
      notificationEmitter.off('notification', send);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

