import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommandPalette from '../CommandPalette'

describe('CommandPalette', () => {
  it('opens and closes correctly', () => {
    render(<CommandPalette isOpen={true} setIsOpen={vi.fn()} />)
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CommandPalette isOpen={false} setIsOpen={vi.fn()} />)
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument()
  })

  it('shows recent items when no query', () => {
    render(<CommandPalette isOpen={true} setIsOpen={vi.fn()} />)
    expect(screen.getByText('Recent')).toBeInTheDocument()
  })

  it('filters actions based on search query', async () => {
    const user = userEvent.setup()
    render(<CommandPalette isOpen={true} setIsOpen={vi.fn()} />)
    
    const searchInput = screen.getByPlaceholderText('Type a command or search...')
    await user.type(searchInput, 'inbox')
    
    expect(screen.getByText('Go to Inbox')).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<CommandPalette isOpen={true} setIsOpen={vi.fn()} />)
    
    const searchInput = screen.getByPlaceholderText('Type a command or search...')
    await user.type(searchInput, 'inbox')
    
    // Test arrow key navigation
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' })
    fireEvent.keyDown(searchInput, { key: 'ArrowUp' })
  })

  it('closes on escape key', async () => {
    const setIsOpen = vi.fn()
    render(<CommandPalette isOpen={true} setIsOpen={setIsOpen} />)
    
    const searchInput = screen.getByPlaceholderText('Type a command or search...')
    fireEvent.keyDown(searchInput, { key: 'Escape' })
    
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })

  it('shows categories correctly', async () => {
    const user = userEvent.setup()
    render(<CommandPalette isOpen={true} setIsOpen={vi.fn()} />)
    
    const searchInput = screen.getByPlaceholderText('Type a command or search...')
    await user.type(searchInput, 'create')
    
    expect(screen.getByText('Create')).toBeInTheDocument()
  })
})
