import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";

// Import all pages
import ProjectsPage from "@/pages/projects";
import TasksPage from "@/pages/tasks";
import DashboardPage from "@/pages/dashboard";
import ExpensesPage from "@/pages/expenses";
import ContactsPage from "@/pages/contacts";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ProjectsPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/expenses" component={ExpensesPage} />
      <Route path="/contacts" component={ContactsPage} />
      
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
