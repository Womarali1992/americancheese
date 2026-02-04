import { useState, useEffect, useCallback } from 'react';

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  company?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get initials from name
  const getInitials = useCallback((name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, []);

  // Load user from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
    setIsLoading(false);
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        },
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data and redirect
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authToken');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/login';
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    initials: user ? getInitials(user.name) : '??',
    logout
  };
}
