import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PipelinePage from '../page';

vi.mock('@/components/app/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/pipeline/EnhancedPipelineBoard', () => ({
  default: ({ selectedFilters }: { selectedFilters: string[] }) => (
    <div data-testid="filters">{JSON.stringify(selectedFilters)}</div>
  ),
}));

describe('PipelinePage quick filters', () => {
  it('applies and resets filters', async () => {
    const user = userEvent.setup();
    render(<PipelinePage />);

    const output = () => screen.getByTestId('filters').textContent;

    expect(output()).toBe('[]');

    const highValue = screen.getByRole('button', { name: /High Value/i });
    await user.click(highValue);
    expect(output()).toBe(JSON.stringify(['High Value']));

    const overdue = screen.getByRole('button', { name: /Overdue/i });
    await user.click(overdue);
    expect(output()).toBe(JSON.stringify(['High Value', 'Overdue']));

    await user.click(highValue);
    expect(output()).toBe(JSON.stringify(['Overdue']));
  });
});

