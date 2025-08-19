import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InboxPage from '../page';

vi.mock('@/components/app/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/inbox/EnhancedInbox', () => ({
  default: ({ selectedFilter }: { selectedFilter: string }) => (
    <div data-testid="filter">{selectedFilter}</div>
  ),
}));

describe('InboxPage quick filters', () => {
  it('applies and resets filters', async () => {
    const user = userEvent.setup();
    render(<InboxPage />);

    const output = () => screen.getByTestId('filter').textContent;
    expect(output()).toBe('');

    const unread = screen.getByRole('button', { name: /Unread/i });
    await user.click(unread);
    expect(output()).toBe('Unread');

    await user.click(unread);
    expect(output()).toBe('');
  });
});

