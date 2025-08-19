import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuickActionsMenu from '../QuickActionsMenu'
import { useRouter } from 'next/navigation'

describe('QuickActionsMenu', () => {
  const pushMock = vi.fn()
  const routerMock = {
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as any
  vi.mocked(useRouter).mockReturnValue(routerMock)

  const actions = [
    { label: 'Create New Lead', path: '/app/pipeline?action=create' },
    { label: 'Compose Email', path: '/app/inbox?compose=true' },
    { label: 'Schedule Meeting', path: '/app/calendar?action=create' },
    { label: 'Create Task', path: '/app/tasks?action=create' },
    { label: 'Go to Dashboard', path: '/app' },
    { label: 'Open Inbox', path: '/app/inbox' },
    { label: 'View Pipeline', path: '/app/pipeline' },
    { label: 'Open Calendar', path: '/app/calendar' },
    { label: 'Open Settings', path: '/app/settings' },
    { label: 'Manage Integrations', path: '/app/settings/integrations' },
    { label: 'View Reports', path: '/app/analytics' },
    { label: 'AI Chat Assistant', path: '/app/chat' },
  ]

  actions.forEach(({ label, path }) => {
    it(`navigates to ${path} when selecting ${label}`, async () => {
      const user = userEvent.setup()
      render(<QuickActionsMenu isOpen={true} onClose={() => {}} />)
      const button = screen.getByText(label).closest('button') as HTMLButtonElement
      await user.click(button)
      expect(pushMock).toHaveBeenCalledWith(path)
      pushMock.mockClear()
    })
  })
})
