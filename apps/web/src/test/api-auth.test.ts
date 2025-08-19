import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@rivor/db', () => ({ prisma: {} }));
import { auth } from '@/server/auth';
import { GET as getDashboard } from '@/app/api/dashboard/route';
import { GET as getNotifications } from '@/app/api/user/notifications/route';
import { GET as getContactActivities } from '@/app/api/contacts/[contactId]/activities/route';

const mockAuth = vi.mocked(auth);

beforeEach(() => {
  mockAuth.mockReset();
});

describe('Unauthorized API access', () => {
  it('GET /api/dashboard without session returns 401', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/dashboard');
    const res = await getDashboard(req);
    expect(res.status).toBe(401);
  });

  it('GET /api/user/notifications without session returns 401', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await getNotifications();
    expect(res.status).toBe(401);
  });

  it('GET /api/activity without session returns 401', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/activity');
    const res = await getContactActivities(req, { params: { contactId: 'test-contact' } });
    expect(res.status).toBe(401);
  });

  it('GET /api/activity with session but no org returns 400', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'user@example.com' } } as any);
    const req = new NextRequest('http://localhost/api/activity');
    const res = await getContactActivities(req, { params: { contactId: 'test-contact' } });
    expect(res.status).toBe(400);
  });
});

