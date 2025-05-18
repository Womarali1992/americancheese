import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<Response> {
  // Get auth token from localStorage
  const authToken = localStorage.getItem('authToken');
  
  // Base headers
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  // Add Authorization header with token if available
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // This ensures cookies are sent with the request
  });

  // Handle authentication errors
  if (res.status === 401) {
    console.error('Authentication failed, token invalid or expired');
    localStorage.removeItem('authToken');
    
    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
      return res; // Return early to prevent throwIfResNotOk
    }
  }

  // For non-GET requests that involve bidirectional relationships, 
  // invalidate both sides of the relationship after successful request
  if (method !== "GET" && res.ok) {
    // Special handling for material-task relationship updates
    if (url.includes('/api/materials') && data && typeof data === 'object' && 'taskIds' in data) {
      console.log("Material with taskIds updated, invalidating tasks cache");
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
    
    // Special handling for task-material relationship updates
    if (url.includes('/api/tasks') && data && typeof data === 'object' && 'materialIds' in data) {
      console.log("Task with materialIds updated, invalidating materials cache");
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
    }
    
    // Always invalidate task cache when updating tasks, especially for date changes
    if (url.includes('/api/tasks/') && method === 'PATCH') {
      console.log(`Task updated via PATCH at ${url}, invalidating task cache`);
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Also invalidate project tasks queries
      // This ensures the task list for a project is refreshed
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0]?.toString().includes('/api/projects') && 
                query.queryKey[0]?.toString().includes('/tasks');
        }
      });
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token from localStorage
    const authToken = localStorage.getItem('authToken');
    
    // Setup headers with auth token if available
    const headers: HeadersInit = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    
    // Build URL with query parameters if present
    let url = queryKey[0] as string;
    const params = queryKey[1];
    
    if (params && typeof params === 'object') {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }
    
    const res = await fetch(url, {
      headers,
      credentials: "include", // Keep for cookie support
    });

    // Handle auth errors
    if (res.status === 401) {
      console.log('Authentication failed in query:', queryKey[0]);
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      // Clear token and redirect if not on login page
      localStorage.removeItem('authToken');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
        // Wait briefly to avoid errors in browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    await throwIfResNotOk(res);
    const jsonData = await res.json();
    
    // Debug log for material-related requests
    if (queryKey[0].toString().includes('/api/materials')) {
      console.log("API Response for materials query:", queryKey[0]);
      
      // If this is a single material fetch, add detailed logging
      if (queryKey[0].toString().match(/\/api\/materials\/\d+/)) {
        const material = jsonData;
        console.log("Material data structure from API:", JSON.parse(JSON.stringify(material)));
        console.log("Material taskIds:", material.taskIds);
        console.log("Material taskIds type:", material.taskIds ? typeof material.taskIds : "undefined");
        
        if (Array.isArray(material.taskIds)) {
          console.log("Material taskIds array length:", material.taskIds.length);
          console.log("Material taskIds array elements:", material.taskIds);
          console.log("Material taskIds array element types:", material.taskIds.map(id => typeof id));
          
          // Convert any string IDs to numbers for consistency
          if (material.taskIds.some(id => typeof id === 'string')) {
            material.taskIds = material.taskIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
            console.log("Converted material taskIds to numbers:", material.taskIds);
          }
        } else if (material.taskIds === null) {
          // Initialize as empty array if null
          material.taskIds = [];
          console.log("Initialized null taskIds as empty array");
        }
      }
      
      // For the materials list, check for consistent taskIds format
      if (Array.isArray(jsonData) && queryKey[0].toString() === '/api/materials') {
        console.log("Materials list received, fixing taskIds format if needed");
        jsonData.forEach((material, index) => {
          if (material.taskIds === null) {
            material.taskIds = [];
          } else if (Array.isArray(material.taskIds) && material.taskIds.some(id => typeof id === 'string')) {
            material.taskIds = material.taskIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
          }
        });
      }
    }
    
    return jsonData;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
