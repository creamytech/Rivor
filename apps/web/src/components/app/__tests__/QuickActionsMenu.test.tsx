import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuickActionsMenu from '../QuickActionsMenu'

// helper to render menu
const renderMenu = () => render(<QuickActionsMenu isOpen={true} onClose={() => {}} />)

describe('QuickActionsMenu actions', () => {
  it('navigates to task creation', async () => {
    const user = userEvent.setup()
    const originalLocation = window.location
    // Mock location to allow assignment
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete window.location
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.location = { href: 'http://localhost' }

    renderMenu()
    await user.click(screen.getByText('Create Task'))
    expect(window.location.href).toContain('/app/tasks/create')

    window.location = originalLocation
  })

  it('opens chat agent via event', async () => {
    const user = userEvent.setup()
    let opened = false
    const handler = () => {
      opened = true
    }
    window.addEventListener('chat-agent:open', handler)

    renderMenu()
    await user.click(screen.getByText('AI Chat Assistant'))
    expect(opened).toBe(true)

    window.removeEventListener('chat-agent:open', handler)
  })
})
