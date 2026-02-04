import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Lock, Plus, Search, Key, Globe, Database, FileKey,
  MoreVertical, Eye, Pencil, Trash2, AlertCircle, Clock
} from 'lucide-react';
import { CredentialDialog } from '@/components/credentials/CredentialDialog';
import { RevealCredentialDialog } from '@/components/credentials/RevealCredentialDialog';
import { DeleteCredentialDialog } from '@/components/credentials/DeleteCredentialDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';

// Types
interface Credential {
  id: number;
  name: string;
  category: string;
  website: string | null;
  username: string | null;
  maskedValue: string;
  notes: string | null;
  expiresAt: string | null;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
}

// Category icon mapping
const categoryIcons: Record<string, React.ElementType> = {
  api_key: Key,
  password: Lock,
  connection_string: Database,
  certificate: FileKey,
  other: Lock,
};

// Category labels
const categoryLabels: Record<string, string> = {
  api_key: 'API Key',
  password: 'Password',
  connection_string: 'Connection String',
  certificate: 'Certificate',
  other: 'Other',
};

export default function CredentialsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [revealingCredential, setRevealingCredential] = useState<Credential | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<Credential | null>(null);

  // Fetch credentials
  const { data, isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: async () => {
      const response = await fetch('/api/credentials');
      if (!response.ok) throw new Error('Failed to fetch credentials');
      return response.json();
    }
  });

  const credentials: Credential[] = data?.credentials || [];

  // Filter credentials by search
  const filteredCredentials = credentials.filter(cred =>
    cred.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cred.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cred.website?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/credentials/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setDeletingCredential(null);
      toast({ title: 'Deleted', description: 'Credential deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete credential', variant: 'destructive' });
    }
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || Lock;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Credentials Vault</h1>
                <p className="text-gray-500 mt-1">Securely store and manage your sensitive credentials</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search credentials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Lock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Encrypted Storage:</strong> All credential values are encrypted with AES-256-GCM.
            Revealing a credential requires your password for additional security.
          </AlertDescription>
        </Alert>

        {/* Credentials Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading credentials...</div>
        ) : filteredCredentials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {searchQuery ? 'No credentials match your search' : 'No credentials stored yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Try a different search term' : 'Add your first credential to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCredentials.map((credential) => (
              <Card
                key={credential.id}
                className={`hover:shadow-md transition-shadow ${credential.isExpired ? 'border-amber-300 bg-amber-50/50' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${credential.isExpired ? 'bg-amber-100' : 'bg-gray-100'}`}>
                        {getCategoryIcon(credential.category)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{credential.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {categoryLabels[credential.category] || 'Other'}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setRevealingCredential(credential)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Reveal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingCredential(credential)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingCredential(credential)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {credential.isExpired && (
                    <div className="flex items-center gap-1 text-amber-600 text-xs mb-2">
                      <AlertCircle className="h-3 w-3" />
                      Expired
                    </div>
                  )}

                  {credential.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{credential.website}</span>
                    </div>
                  )}

                  {credential.username && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="text-gray-400">Username:</span> {credential.username}
                    </div>
                  )}

                  <div className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                    {credential.maskedValue}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
                    <Clock className="h-3 w-3" />
                    Last accessed: {formatDate(credential.lastAccessedAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <CredentialDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          credential={null}
        />

        <CredentialDialog
          open={!!editingCredential}
          onOpenChange={(open) => !open && setEditingCredential(null)}
          credential={editingCredential}
        />

        <RevealCredentialDialog
          open={!!revealingCredential}
          onOpenChange={(open) => !open && setRevealingCredential(null)}
          credential={revealingCredential}
        />

        <DeleteCredentialDialog
          open={!!deletingCredential}
          onOpenChange={(open) => !open && setDeletingCredential(null)}
          credential={deletingCredential}
          onConfirm={() => deletingCredential && deleteMutation.mutate(deletingCredential.id)}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
}
