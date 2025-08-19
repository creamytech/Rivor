import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import InboxPage from '../page'
import React from 'react'

vi.mock('@/components/app/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('framer-motion', () => ({
  motion: { div: (props: any) => <div {...props} /> },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}))

describe('InboxPage filters', () => {
  beforeEach(() => {
    const threadsByFilter: Record<string, string> = {
      default: 'Default Thread',
      unread: 'Unread Thread',
      'high-priority': 'High Priority Thread',
      'this-week': 'This Week Thread',
      overdue: 'Overdue Thread'
    }

    global.fetch = vi.fn((url: any) => {
      if (typeof url === 'string' && url.includes('/api/inbox/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            tabs: { leads: 1, review: 1, other: 1 },
            quickFilters: {
              unread: 1,
              highPriority: 1,
              thisWeek: 1,
              overdue: 1
            }
          })
        })
      }
      if (typeof url === 'string' && url.includes('/api/inbox/threads')) {
        const params = new URL(url, 'http://localhost').searchParams
        const filters = params.getAll('filter')
        const filter = filters[filters.length - 1] || 'default'
        return Promise.resolve({
          ok: true,
          json: async () => ({
            threads: [
              {
                id: '1',
                subject: threadsByFilter[filter],
                snippet: '',
                participants: [{ name: 'A', email: 'a@example.com' }],
                messageCount: 1,
                unread: false,
                starred: false,
                hasAttachments: false,
                labels: [],
                lastMessageAt: '2024-01-01',
                updatedAt: '2024-01-01'
              }
            ]
          })
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    }) as any
  })

  it('updates displayed threads when quick filters are selected', async () => {
    render(<InboxPage />)

    await screen.findByText('Default Thread')

    const filters = [
      { id: 'unread', label: 'Unread', result: 'Unread Thread' },
      { id: 'high-priority', label: 'High Priority', result: 'High Priority Thread' },
      { id: 'this-week', label: 'This Week', result: 'This Week Thread' },
      { id: 'overdue', label: 'Overdue', result: 'Overdue Thread' }
    ]

    for (const f of filters) {
      fireEvent.click(screen.getByText(f.label))
      await waitFor(() => expect(screen.getByText(f.result)).toBeInTheDocument())
    }
  })
})
