import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with password:', password);
      
      // Login approach with multiple fallbacks
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password }),
        credentials: 'include' // Include cookies in the response
      });
      
      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok && data.token) {
        // Store token in multiple places for redundancy
        // 1. In localStorage
        localStorage.setItem('authToken', data.token);
        
        // 2. In sessionStorage
        sessionStorage.setItem('authToken', data.token);
        
        // 3. In cookies (in addition to server-set cookies) - use the expected cookie name
        document.cookie = `cm-app-auth-token-123456=${data.token}; path=/; max-age=86400; SameSite=Lax`;
        
        // 4. Setup global fetch interceptor to include token in all requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          // Get the saved token from localStorage
          const token = localStorage.getItem('authToken');
          
          // Create options.headers if it doesn't exist
          if (!options.headers) {
            options.headers = {};
          }
          
          // Add auth header if token exists and not a login request
          if (token && typeof url === 'string' && !url.includes('/api/auth/login')) {
            // Add multiple auth headers
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${token}`,
              'X-Access-Token': token
            };
            
            // Ensure credentials are included
            options.credentials = 'include';
            
            // Add token to URL query params
            if (url.includes('?')) {
              url = `${url}&token=${token}`;
            } else {
              url = `${url}?token=${token}`;
            }
          }
          
          // Call original fetch with modified parameters
          return originalFetch(url, options);
        };
        
        // Display success message
        console.log('Login successful! Redirecting to dashboard...');
        console.log('Login successful with token:', data.token);
        console.log('Session ID:', data.ip);
        
        // Redirect to dashboard after a small delay to ensure cookies are set
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 200);
        return;
      } else {
        console.error('Login failed:', data.message);
        setError(data.message || 'Invalid password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Construction Management</CardTitle>
          <CardDescription>Enter your password to access the app</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}