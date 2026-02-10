import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Check if user is already logged in to the app
const useAuthRedirect = () => {
  useEffect(() => {
    // Check auth status on app subdomain
    fetch("https://app.sitesetups.com/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          // User is logged in, redirect to app
          window.location.href = "https://app.sitesetups.com";
        }
      })
      .catch(() => {
        // Not logged in or error, stay on landing page
      });
  }, []);
};

const App = () => {
  useAuthRedirect();

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
