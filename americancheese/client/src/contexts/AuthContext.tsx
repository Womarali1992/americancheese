import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// User type matching the server response
export interface User {
  id: number;
  email: string;
  name: string;
  company?: string | null;
  role?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// API helper that always includes credentials
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Check current authentication status
  const refreshUser = useCallback(async () => {
    try {
      const response = await authFetch('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setState({ user: data.user, loading: false, error: null });
          return;
        }
      }

      // Not authenticated
      setState({ user: null, loading: false, error: null });
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({ user: null, loading: false, error: 'Failed to verify authentication' });
    }
  }, []);

  // Initial auth check on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token in localStorage as backup (for API tokens)
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }

        setState({
          user: data.user,
          loading: false,
          error: null,
        });

        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Login failed',
        }));
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store token in localStorage as backup
        if (result.token) {
          localStorage.setItem('authToken', result.token);
        }

        setState({
          user: result.user,
          loading: false,
          error: null,
        });

        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.message || 'Registration failed',
        }));
        return { success: false, error: result.message || 'Registration failed' };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    }

    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');

    // Clear state
    setState({ user: null, loading: false, error: null });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!state.user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Optional: Hook for checking if user has specific role
export function useRequireAuth(requiredRole?: string): AuthContextValue & { hasAccess: boolean } {
  const auth = useAuth();
  const hasAccess = auth.isAuthenticated && (!requiredRole || auth.user?.role === requiredRole);
  return { ...auth, hasAccess };
}
