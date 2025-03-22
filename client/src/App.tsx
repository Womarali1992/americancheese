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

// Authentication check component
function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Check if we're authenticated on component mount
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        
        // First check the test endpoint, which doesn't require auth but shows session state
        const testResponse = await fetch('/api/test', {
          credentials: 'include'
        });
        const testData = await testResponse.json();
        console.log('Test endpoint response:', testData);
        
        // Make a test request to an API endpoint
        const response = await fetch('/api/projects', {
          credentials: 'include'
        });
        
        console.log('Projects API response status:', response.status);
        
        if (response.status === 401) {
          // Not authenticated
          console.log('Auth check failed, redirecting to login');
          setIsAuthenticated(false);
          setLocation('/login');
        } else {
          console.log('Auth check succeeded, user is authenticated');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setLocation('/login');
      }
    };
    
    checkAuth();
  }, [setLocation]);
  
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
