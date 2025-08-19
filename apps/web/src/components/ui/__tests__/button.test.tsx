import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    render(<Button variant="brand">Brand Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gradient-to-r')
  })

  it('can be disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    )

    const button = screen.getByRole('button')
    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none')
  })

  it('supports different sizes', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-9')
  })

  it('works as a link when asChild is used', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
  })
})
