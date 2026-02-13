import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock all heavy dependencies before importing TopNav
vi.mock('@/hooks/useTabNavigation', () => ({
  useTabNavigation: () => ({ navigateToTab: vi.fn() }),
  useCurrentTab: () => 'dashboard',
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: { name: 'Test', email: 'test@test.com' },
    initials: 'T',
    logout: vi.fn(),
  }),
}));

vi.mock('@/lib/color-themes', () => ({
  getDynamicModuleColor: () => ({
    primaryColor: '#6366f1',
    textColor: '#4f46e5',
    borderColor: '#a5b4fc',
  }),
}));

vi.mock('@/components/GlobalSearch', () => ({
  GlobalSearch: () => <div data-testid="global-search">Global Search</div>,
}));

vi.mock('@/components/layout/Logo', () => ({
  Logo: ({ className }: { className?: string }) => <div data-testid="logo" className={className}>Logo</div>,
}));

vi.mock('@/components/layout/InvitationsBadge', () => ({
  InvitationsBadge: () => <div data-testid="invitations-badge">Badge</div>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  AvatarFallback: ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={className}>{children}</span>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Import after mocks are set up
import { NavProvider, useNav } from '@/contexts/NavContext';
import { TopNav } from '@/components/layout/TopNav';

// Helper to set NavContext values before TopNav renders
function TopNavWithPills({ pills, actions }: { pills?: any[]; actions?: React.ReactNode }) {
  return (
    <NavProvider>
      <NavSetter pills={pills} actions={actions} />
      <TopNav />
    </NavProvider>
  );
}

function NavSetter({ pills, actions }: { pills?: any[]; actions?: React.ReactNode }) {
  const { setPills, setActions } = useNav();
  React.useEffect(() => {
    if (pills) setPills(pills);
    if (actions) setActions(actions);
  }, [pills, actions, setPills, setActions]);
  return null;
}

function StubIcon({ className }: { className?: string }) {
  return <svg data-testid="stub-icon" className={className} />;
}

describe('TopNav', () => {
  it('renders standard nav tabs when no pills in context', () => {
    render(
      <NavProvider>
        <TopNav />
      </NavProvider>
    );

    // Standard tabs should be present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
  });

  it('renders pills INSTEAD of tabs when pills are set in context', () => {
    const testPills = [
      { id: 'projects', icon: StubIcon, count: 12, label: 'Projects', navigateTo: '/', color: '#6366f1', isActive: true },
      { id: 'tasks', icon: StubIcon, count: 396, label: 'Tasks', navigateTo: '/tasks', color: '#22c55e', isActive: false },
    ];

    render(<TopNavWithPills pills={testPills} />);

    // Pill counts should be visible
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('396')).toBeInTheDocument();

    // Standard tab labels should NOT be visible (replaced by pills)
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
  });

  it('renders custom actions instead of GlobalSearch when actions set', () => {
    const customActions = <button data-testid="custom-action">New Project</button>;

    render(<TopNavWithPills actions={customActions} />);

    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    // Global search should not render when custom actions are set
    expect(screen.queryByTestId('global-search')).not.toBeInTheDocument();
  });

  it('renders GlobalSearch when no custom actions are set', () => {
    render(
      <NavProvider>
        <TopNav />
      </NavProvider>
    );

    expect(screen.getByTestId('global-search')).toBeInTheDocument();
  });

  it('always renders logo and user avatar regardless of pills', () => {
    const testPills = [
      { id: 'projects', icon: StubIcon, count: 5, label: 'Projects', navigateTo: '/', color: '#6366f1', isActive: true },
    ];

    render(<TopNavWithPills pills={testPills} />);

    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument(); // Avatar initials
  });

  it('uses softer 300-level pastel colors for dashboard nav background', () => {
    const { container } = render(
      <NavProvider>
        <TopNav />
      </NavProvider>
    );

    const nav = container.querySelector('nav');
    // Dashboard (default tab) should use indigo-300 (#a5b4fc) not indigo-400 (#818cf8)
    // jsdom converts hex to rgb format
    expect(nav?.style.backgroundColor).toBe('rgb(165, 180, 252)');
  });
});
