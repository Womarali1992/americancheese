import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global fetch interceptor to add Authorization header to all API requests
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  // Only add auth header for API requests to our server
  if (url.startsWith('/api/') || url.includes('/api/')) {
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
      init = init || {};
      const headers = new Headers(init.headers || {});

      // Only add Authorization if not already present
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }

      init.headers = headers;

      // Ensure credentials are included
      if (!init.credentials) {
        init.credentials = 'include';
      }
    }
  }

  return originalFetch.call(window, input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
