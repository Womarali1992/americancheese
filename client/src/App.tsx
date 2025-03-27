import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";

// Import all pages
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/projects/[id]";
import TasksPage from "@/pages/tasks";
import DashboardPage from "@/pages/dashboard";
import ExpensesPage from "@/pages/expenses";
import ContactsPage from "@/pages/contacts";
import MaterialsPage from "@/pages/materials";
import LoginPage from "@/pages/login";

// Authentication check component using token auth
function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [location] = useLocation();
  
  // Set up global fetch interceptor to inject auth token into all requests
  useEffect(() => {
    // Override the fetch function to inject tokens
    const originalFetch = window.fetch;
    window.fetch = function(input, init = {}) {
      const authToken = localStorage.getItem('authToken');
      
      if (authToken) {
        // Create headers if they don't exist
        if (!init.headers) {
          init.headers = {};
        }
        
        // Add auth token to headers
        init.headers = {
          ...init.headers,
          'Authorization': `Bearer ${authToken}`
        };
        
        // Ensure cookies are always sent
        init.credentials = 'include';
        
        // If URL is string and not login endpoint, add token as query param too
        if (typeof input === 'string' && !input.includes('/api/auth/login')) {
          const separator = input.includes('?') ? '&' : '?';
          input = `${input}${separator}token=${authToken}`;
        }
      }
      
      return originalFetch(input, init);
    };
    
    // This function is run only once on mount
    console.log('Set up fetch interceptor to inject auth token into all requests');
    
    // Also set token as a cookie for cookie-based auth fallback
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      // Use the exact cookie name expected by the server's auth middleware
      document.cookie = `cm-app-auth-token-123456=${authToken}; path=/; max-age=86400`;
      console.log('Set auth token cookie:', authToken);
    }
  }, []);
  
  useEffect(() => {
    // Skip auth check if already on login page to avoid redirect loops
    if (location === '/login') {
      setIsAuthenticated(true);
      return;
    }

    // First check for auth token in localStorage (instant check)
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      // No token found, redirect to login
      console.log('No auth token found, redirecting to login');
      setIsAuthenticated(false);
      window.location.href = '/login';
      return;
    }
    
    // Check if we're authenticated on component mount
    const checkAuth = async () => {
      try {
        console.log('Verifying auth token...');
        
        // Check a secure API endpoint with token in header AND query param (double safety)
        const response = await fetch(`/api/projects?token=${authToken}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`, // Use token in header
            'X-Access-Token': authToken, // Also send as custom header
            'Cache-Control': 'no-cache'
          },
          credentials: 'include' // Include cookies
        });
        
        if (response.status === 401) {
          // Token invalid or expired
          console.log('Auth token invalid, redirecting to login');
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
          window.location.href = '/login';
        } else {
          // Token verified
          console.log('Auth token valid, user is authenticated');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [location]);
  
  // Show loading indicator while checking auth
  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Checking authentication...</div>
    </div>;
  }
  
  return <>{children}</>;
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <AuthCheck>
      <Component {...rest} />
    </AuthCheck>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={(props) => <ProtectedRoute component={DashboardPage} {...props} />} />
      <Route path="/dashboard" component={(props) => <ProtectedRoute component={DashboardPage} {...props} />} />
      <Route path="/projects" component={(props) => <ProtectedRoute component={ProjectsPage} {...props} />} />
      <Route path="/projects/:id" component={(props) => <ProtectedRoute component={ProjectDetailPage} {...props} />} />
      <Route path="/tasks" component={(props) => <ProtectedRoute component={TasksPage} {...props} />} />
      <Route path="/expenses" component={(props) => <ProtectedRoute component={ExpensesPage} {...props} />} />
      <Route path="/contacts" component={(props) => <ProtectedRoute component={ContactsPage} {...props} />} />
      <Route path="/materials" component={(props) => <ProtectedRoute component={MaterialsPage} {...props} />} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
