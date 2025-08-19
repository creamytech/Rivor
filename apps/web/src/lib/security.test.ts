import { describe, expect, test, vi } from 'vitest';

vi.mock('@/server/auth', () => ({ auth: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

import { hasPermission, type SecurityContext } from './security';

describe('hasPermission for member delete', () => {
  const context: SecurityContext = {
    userId: 'user1',
    userEmail: 'user@example.com',
    orgId: 'org1',
    role: 'member'
  };

  test('allows deleting tasks and notes', () => {
    expect(hasPermission(context, 'task', 'delete')).toBe(true);
    expect(hasPermission(context, 'note', 'delete')).toBe(true);
  });

  test('disallows deleting other resources', () => {
    expect(hasPermission(context, 'lead', 'delete')).toBe(false);
  });
});
