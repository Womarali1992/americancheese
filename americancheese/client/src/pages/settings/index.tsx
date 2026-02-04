import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Key, Plus, Copy, Trash2, AlertCircle, Check, Clock, Shield } from 'lucide-react';

interface ApiToken {
  id: number;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  revokedAt: string | null;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNewTokenDialog, setShowNewTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [copied, setCopied] = useState(false);

  // Fetch tokens
  const { data: tokensData, isLoading } = useQuery({
    queryKey: ['api-tokens'],
    queryFn: async () => {
      const response = await fetch('/api/auth/tokens');
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    }
  });

  const tokens: ApiToken[] = tokensData?.tokens || [];

  // Create token mutation
  const createTokenMutation = useMutation({
    mutationFn: async ({ name, expiresInDays }: { name: string; expiresInDays?: number }) => {
      const response = await fetch('/api/auth/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, expiresInDays: expiresInDays || null })
      });
      if (!response.ok) throw new Error('Failed to create token');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setNewToken(data.token);
      setShowCreateDialog(false);
      setShowNewTokenDialog(true);
      setTokenName('');
      setExpiresInDays('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create API token',
        variant: 'destructive'
      });
    }
  });

  // Revoke token mutation
  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      const response = await fetch(`/api/auth/tokens/${tokenId}/revoke`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to revoke token');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      toast({
        title: 'Token Revoked',
        description: 'The API token has been revoked and can no longer be used.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to revoke token',
        variant: 'destructive'
      });
    }
  });

  // Delete token mutation
  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      const response = await fetch(`/api/auth/tokens/${tokenId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete token');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      toast({
        title: 'Token Deleted',
        description: 'The API token has been permanently deleted.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete token',
        variant: 'destructive'
      });
    }
  });

  const handleCreateToken = () => {
    if (!tokenName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the token',
        variant: 'destructive'
      });
      return;
    }
    createTokenMutation.mutate({
      name: tokenName,
      expiresInDays: expiresInDays ? Number(expiresInDays) : undefined
    });
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Token copied to clipboard'
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTokenStatus = (token: ApiToken) => {
    if (token.revokedAt) return { label: 'Revoked', color: 'text-red-600 bg-red-50' };
    if (!token.isActive) return { label: 'Inactive', color: 'text-gray-600 bg-gray-100' };
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return { label: 'Expired', color: 'text-amber-600 bg-amber-50' };
    }
    return { label: 'Active', color: 'text-green-600 bg-green-50' };
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and API access</p>
        </div>

        {/* API Tokens Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>API Tokens</CardTitle>
                  <CardDescription>
                    Manage API tokens for MCP servers and external integrations
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Token
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* MCP Configuration Info */}
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>MCP Configuration:</strong> Add your token to your <code className="bg-blue-100 px-1 rounded">.mcp.json</code> file:
                <pre className="mt-2 p-3 bg-blue-100 rounded text-xs overflow-x-auto">
{`{
  "mcpServers": {
    "american-cheese": {
      "command": "node",
      "args": ["mcp-server/api-index.js"],
      "env": {
        "API_BASE_URL": "${window.location.origin}",
        "API_TOKEN": "your_token_here"
      }
    }
  }
}`}
                </pre>
              </AlertDescription>
            </Alert>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading tokens...</div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No API tokens yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Generate a token to connect MCP servers or external tools
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token) => {
                  const status = getTokenStatus(token);
                  return (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded">
                          <Key className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{token.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="font-mono">{token.tokenPrefix}...</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last used: {formatDate(token.lastUsedAt)}
                            </span>
                            {token.expiresAt && (
                              <span>Expires: {formatDate(token.expiresAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {token.isActive && !token.revokedAt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeTokenMutation.mutate(token.id)}
                            disabled={revokeTokenMutation.isPending}
                          >
                            Revoke
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteTokenMutation.mutate(token.id)}
                          disabled={deleteTokenMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Token Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate API Token</DialogTitle>
              <DialogDescription>
                Create a new API token for MCP servers or external integrations.
                The token will only be shown once after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tokenName">Token Name</Label>
                <Input
                  id="tokenName"
                  placeholder="e.g., MCP Server, CI/CD Pipeline"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  A descriptive name to help you identify this token
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresInDays">Expiration (optional)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  placeholder="Days until expiration (leave empty for no expiration)"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value ? Number(e.target.value) : '')}
                  min={1}
                />
                <p className="text-xs text-gray-500">
                  Leave empty for a token that never expires
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateToken}
                disabled={createTokenMutation.isPending}
              >
                {createTokenMutation.isPending ? 'Creating...' : 'Generate Token'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Token Display Dialog */}
        <Dialog open={showNewTokenDialog} onOpenChange={setShowNewTokenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Token Created Successfully
              </DialogTitle>
              <DialogDescription>
                Copy your new API token now. You won't be able to see it again!
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Make sure to copy your token now. For security reasons, it cannot be displayed again.
                </AlertDescription>
              </Alert>
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono break-all">{newToken}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToken}
                    className="ml-2 flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                setShowNewTokenDialog(false);
                setNewToken('');
              }}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
