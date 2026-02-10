import { useCallback } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

// Re-export User type for backward compatibility
export type CurrentUser = User;

// Helper to get initials from name
function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useCurrentUser() {
  const { user, loading, logout: authLogout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Wrap logout to redirect after
  const logout = useCallback(async () => {
    await authLogout();
    setLocation('/login');
  }, [authLogout, setLocation]);

  return {
    user,
    isLoading: loading,
    isAuthenticated,
    initials: user ? getInitials(user.name) : '??',
    logout
  };
}
