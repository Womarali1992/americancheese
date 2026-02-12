import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { NavPill } from '@/components/layout/NavPill';

function StubIcon({ className }: { className?: string }) {
  return <svg data-testid="pill-icon" className={className} />;
}

describe('NavPill', () => {
  const defaultProps = {
    icon: StubIcon,
    count: 12,
    label: 'Projects',
    navigateTo: '/projects',
    color: 'indigo',
    isActive: false,
    onClick: vi.fn(),
  };

  it('renders count and label', () => {
    render(<NavPill {...defaultProps} />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(<NavPill {...defaultProps} />);

    expect(screen.getByTestId('pill-icon')).toBeInTheDocument();
  });

  it('applies active styling when isActive is true', () => {
    const { container } = render(<NavPill {...defaultProps} isActive={true} />);

    const button = container.querySelector('button');
    expect(button?.className).toContain('font-semibold');
  });

  it('applies inactive styling when isActive is false', () => {
    const { container } = render(<NavPill {...defaultProps} isActive={false} />);

    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-white');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<NavPill {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });
});
