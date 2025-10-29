import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { SimpleLayout } from "@/components/layout/SimpleLayout";

// Import simplified pages
import SimpleDashboard from "@/pages/dashboard/SimpleDashboard";
import SimpleProjectsPage from "@/pages/projects/SimpleProjectsPage";
import SimpleTasksPage from "@/pages/tasks/SimpleTasksPage";
import MaterialsPage from "@/pages/materials";
import ContactsPage from "@/pages/contacts";
import AdminPage from "@/pages/admin";
import ProjectDetailPage from "@/pages/projects/[id]";
import LoginPage from "@/pages/login";

// Simple authentication - no complex token handling
function AuthCheck({ children }: { children: React.ReactNode }) {
  // For simplicity, assume authentication passes
  // In a real app, you'd check for valid tokens here
  return <>{children}</>;
}

function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthCheck>
        <SimpleLayout>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/" component={SimpleDashboard} />
            <Route path="/projects" component={SimpleProjectsPage} />
            <Route path="/projects/:id" component={ProjectDetailPage} />
            <Route path="/tasks" component={SimpleTasksPage} />
            <Route path="/materials" component={MaterialsPage} />
            <Route path="/contacts" component={ContactsPage} />
            <Route path="/admin" component={AdminPage} />
            <Route component={NotFound} />
          </Switch>
        </SimpleLayout>
      </AuthCheck>
      <Toaster />
    </QueryClientProvider>
  );
}

export default SimpleApp;