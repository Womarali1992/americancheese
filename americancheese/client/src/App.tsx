import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { SimpleThemeProvider } from "@/components/SimpleThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NavProvider } from "@/contexts/NavContext";
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
import SignupPage from "@/pages/signup";
import AdminPage from "@/pages/admin";
import ProjectTemplatesPage from "@/pages/admin/project-templates";
import CalendarPage from "@/pages/calendar";
import SettingsPage from "@/pages/settings";
import CredentialsPage from "@/pages/credentials";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

import { queryClient } from "./lib/queryClient";

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#eef2ff]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Protected route wrapper - redirects to login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Store intended destination for redirect after login
    sessionStorage.setItem('redirectAfterLogin', location);
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

// Public route wrapper - redirects to dashboard if already authenticated
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect authenticated users away from login/signup
  if (isAuthenticated) {
    const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
    sessionStorage.removeItem('redirectAfterLogin');
    return <Redirect to={redirectTo} />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        <PublicOnlyRoute>
          <LoginPage />
        </PublicOnlyRoute>
      </Route>
      <Route path="/signup">
        <PublicOnlyRoute>
          <SignupPage />
        </PublicOnlyRoute>
      </Route>
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />

      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <ProjectsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/projects/:id/tasks">
        <ProtectedRoute>
          <ProjectTasksPage />
        </ProtectedRoute>
      </Route>
      <Route path="/projects/:id">
        <ProtectedRoute>
          <ProjectDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/tasks/:taskId">
        <ProtectedRoute>
          <TaskDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/tasks">
        <ProtectedRoute>
          <TasksPage />
        </ProtectedRoute>
      </Route>
      <Route path="/contacts/:contactId/labor/:laborId">
        <ProtectedRoute>
          <ContactLaborDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/contacts/:contactId/labor">
        <ProtectedRoute>
          <ContactLaborPage />
        </ProtectedRoute>
      </Route>
      <Route path="/contacts">
        <ProtectedRoute>
          <ContactsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/suppliers/:supplierId/quotes/:quoteId">
        <ProtectedRoute>
          <QuoteDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/suppliers/:supplierId/quotes">
        <ProtectedRoute>
          <SupplierQuotePage />
        </ProtectedRoute>
      </Route>
      <Route path="/materials/:projectId">
        <ProtectedRoute>
          <MaterialsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/materials">
        <ProtectedRoute>
          <MaterialsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/calendar">
        <ProtectedRoute>
          <CalendarPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/project-templates/:projectId">
        <ProtectedRoute>
          <ProjectTemplatesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/credentials">
        <ProtectedRoute>
          <CredentialsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/labor">
        {() => {
          window.location.href = '/contacts?tab=labor';
          return null;
        }}
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavProvider>
          <SimpleThemeProvider>
            <AppRoutes />
            <Toaster />
          </SimpleThemeProvider>
        </NavProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
