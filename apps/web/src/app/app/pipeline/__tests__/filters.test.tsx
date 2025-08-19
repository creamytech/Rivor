import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PipelinePage from '../page'
import React from 'react'

vi.mock('@/components/app/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('framer-motion', () => ({
  motion: { div: (props: any) => <div {...props} /> },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}))

describe('PipelinePage filters', () => {
  beforeEach(() => {
    const leadsByFilter: Record<string, string> = {
      default: 'Default Lead',
      'high-value': 'High Value Lead',
      overdue: 'Overdue Lead',
      'this-week': 'This Week Lead',
      'hot-leads': 'Hot Leads Lead'
    }

    global.fetch = vi.fn((url: any) => {
      if (typeof url === 'string' && url.includes('/api/pipeline/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            highValue: 1,
            overdue: 1,
            thisWeek: 1,
            hotLeads: 1
          })
        })
      }
      if (typeof url === 'string' && url.includes('/api/pipeline/leads')) {
        const params = new URL(url, 'http://localhost').searchParams
        const filter = params.get('filter') || 'default'
        return Promise.resolve({
          ok: true,
          json: async () => ({
            leads: [
              {
                id: '1',
                name: leadsByFilter[filter],
                stage: 'Lead',
                createdAt: '2024-01-01',
                value: 100,
                tags: []
              }
            ]
          })
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    }) as any
  })

  it('updates displayed leads when quick filters are selected', async () => {
    render(<PipelinePage />)

    await screen.findByText('Default Lead')

    const filters = [
      { id: 'high-value', label: 'High Value', result: 'High Value Lead' },
      { id: 'overdue', label: 'Overdue', result: 'Overdue Lead' },
      { id: 'this-week', label: 'This Week', result: 'This Week Lead' },
      { id: 'hot-leads', label: 'Hot Leads', result: 'Hot Leads Lead' }
    ]

    for (const f of filters) {
      fireEvent.click(screen.getByText(f.label))
      await waitFor(() => expect(screen.getByText(f.result)).toBeInTheDocument())
    }
  })
})
