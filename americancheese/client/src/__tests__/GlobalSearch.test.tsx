import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { GlobalSearch } from '@/components/GlobalSearch';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Default: return empty arrays for both endpoints
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Downtown Office' },
            { id: 2, name: 'Uptown Residence' },
          ]),
        });
      }
      if (typeof url === 'string' && url.includes('/api/tasks/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  it('renders search input with projects & tasks placeholder', () => {
    renderWithProviders(<GlobalSearch />);

    const input = screen.getByPlaceholderText('Search projects & tasks...');
    expect(input).toBeInTheDocument();
  });

  it('shows project results section when projects match search query', async () => {
    renderWithProviders(<GlobalSearch />);

    // Wait for projects to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/projects'));
    });

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Downtown');

    // Should show Projects section header
    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    // Should show matching project name (may be inside highlight marks)
    expect(screen.getByText(/Downtown/)).toBeInTheDocument();
  });
});
