import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store token in multiple places for redundancy
        localStorage.setItem('authToken', data.token);
        sessionStorage.setItem('authToken', data.token);
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;

        // Store user info
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Setup global fetch interceptor
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          const token = localStorage.getItem('authToken');

          if (!options.headers) {
            options.headers = {};
          }

          if (token && typeof url === 'string' && !url.includes('/api/auth/')) {
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${token}`,
              'X-Access-Token': token
            };
            options.credentials = 'include';
          }

          return originalFetch(url, options);
        };

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 200);
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#eef2ff] p-4">
      <div className="w-full max-w-sm sm:max-w-md mb-10 text-center">
        <div className="inline-flex items-center justify-center space-x-2 mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            {/* Code brackets with lightning bolt */}
            <path d="M7 7L3 12L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 7L21 12L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 8L10 12.5H14L10 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 tracking-tight">SiteSetups</h1>
        <p className="text-sm text-gray-500">Automated Development Platform</p>
      </div>

      <Card className="w-full max-w-sm sm:max-w-md shadow-md border border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4 space-y-1">
          <CardTitle className="text-xl font-semibold text-gray-800">Welcome Back</CardTitle>
          <CardDescription className="text-sm text-gray-500">Enter your credentials to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="pb-2 space-y-4">
            {error && (
              <Alert variant="destructive" className="text-sm bg-rose-50 text-rose-600 border-rose-100">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-11 text-base bg-white border-gray-200 focus:border-primary focus:ring-primary"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 text-base bg-white border-gray-200 focus:border-primary focus:ring-primary pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-3 pb-6">
            <Button
              className="w-full h-11 text-base bg-primary hover:bg-primary/90 transition-colors shadow-sm"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-center text-gray-500">
              Don't have an account?{' '}
              <a href="/signup" className="text-primary hover:underline font-medium">
                Create one
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-10 text-center text-xs text-gray-500">
        <p>&copy; 2025 SiteSetups. All rights reserved.</p>
      </div>
    </div>
  );
}
