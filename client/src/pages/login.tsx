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
      console.log('Attempting to login with password:', password);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ password }),
        credentials: 'include', // Include cookies in the request
      });

      // Get session ID from response header for debugging
      const sessionId = response.headers.get('X-Session-ID');
      console.log('Login response received, session ID from header:', sessionId);
      
      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok) {
        console.log('Login successful, cookies:', document.cookie);
        
        // Wait longer to ensure cookie is set by the browser
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('Cookies after waiting:', document.cookie);
        
        // Proceed directly to dashboard without checking protected endpoint again
        // This avoids potential race conditions with cookie setting
        setLocation('/dashboard');
        
        // No additional validation here to simplify the flow
        console.log('Redirecting to dashboard...');
      } else {
        console.error('Login failed:', data.message);
        setError(data.message || 'Invalid password');
      }
    } catch (err) {
      setError('Failed to login. Please try again.');
      console.error('Login error:', err);
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