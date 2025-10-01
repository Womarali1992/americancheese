import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { SimpleThemeProvider } from "@/components/SimpleThemeProvider";
import NotFound from "@/pages/not-found";

// Import all pages
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/projects/[id]";
import ProjectTasksPage from "@/pages/projects/[id]/tasks";
import TasksPage from "@/pages/tasks";
import TaskDetailPage from "@/pages/tasks/TaskDetailPage";
import DashboardPage from "@/pages/dashboard";
import ContactsPage from "@/pages/contacts";
import ContactLaborPage from "@/pages/contacts/ContactLaborPage";
import ContactLaborDetailPage from "@/pages/contacts/ContactLaborDetailPage";
import SupplierQuotePage from "@/pages/suppliers/SupplierQuotePage";
import QuoteDetailPage from "@/pages/suppliers/QuoteDetailPage";
import MaterialsPage from "@/pages/materials";
import LoginPage from "@/pages/login";
import AdminPage from "@/pages/admin";
import ProjectTemplatesPage from "@/pages/admin/project-templates";

import { queryClient } from "./lib/queryClient";

function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [location] = useLocation();
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = function(input, init = {}) {
      const authToken = localStorage.getItem('authToken');
      if (authToken && init) {
        init.headers = { ...init.headers, 'Authorization': `Bearer ${authToken}` };
        init.credentials = 'include';
      }
      return originalFetch(input, init);
    };
    
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      document.cookie = `cm-app-auth-token-123456=${authToken}; path=/; max-age=86400`;
    }
  }, []);
  
  useEffect(() => {
    if (location === '/login') {
      setIsAuthenticated(true);
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setIsAuthenticated(false);
      window.location.href = '/login';
      return;
    }
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
      <Route path="/projects/:id/tasks">{(params) => <ProtectedRoute component={ProjectTasksPage} params={params} />}</Route>
      <Route path="/tasks" component={(props) => <ProtectedRoute component={TasksPage} {...props} />} />
      <Route path="/tasks/:taskId" component={(props) => <ProtectedRoute component={TaskDetailPage} {...props} />} />
      <Route path="/contacts" component={(props) => <ProtectedRoute component={ContactsPage} {...props} />} />
      <Route path="/contacts/:contactId/labor/:laborId" component={(props) => <ProtectedRoute component={ContactLaborDetailPage} {...props} />} />
      <Route path="/contacts/:contactId/labor" component={(props) => <ProtectedRoute component={ContactLaborPage} {...props} />} />
      <Route path="/suppliers/:supplierId/quotes/:quoteId" component={(props) => <ProtectedRoute component={QuoteDetailPage} {...props} />} />
      <Route path="/suppliers/:supplierId/quotes" component={(props) => <ProtectedRoute component={SupplierQuotePage} {...props} />} />
      <Route path="/materials/:projectId" component={(props) => <ProtectedRoute component={MaterialsPage} {...props} />} />
      <Route path="/materials" component={(props) => <ProtectedRoute component={MaterialsPage} {...props} />} />
      <Route path="/admin" component={(props) => <ProtectedRoute component={AdminPage} {...props} />} />
      <Route path="/admin/project-templates/:projectId" component={(props) => <ProtectedRoute component={ProjectTemplatesPage} {...props} />} />
      <Route path="/labor" component={() => { window.location.href = '/contacts?tab=labor'; return null; }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleThemeProvider>
        <Router />
        <Toaster />
      </SimpleThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
