import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import SimplifiedCategoryManager from './SimplifiedCategoryManager';

interface ProjectCategorySettingsProps {
  projectId?: number;
}

export default function ProjectCategorySettings({ projectId }: ProjectCategorySettingsProps) {
  const { toast } = useToast();

  const clearLocalStorageCategories = () => {
    try {
      // Clear global category names
      localStorage.removeItem('globalCategoryNames');
      
      // Clear all project-specific category names
      const keys = Object.keys(localStorage).filter(key => key.startsWith('categoryNames_'));
      keys.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Cache Cleared",
        description: "All local category customizations have been cleared. The page will refresh to apply changes.",
      });
      
      // Refresh to reload with database categories only
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      toast({
        title: "Error",
        description: "Failed to clear local storage. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert about the new system */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>New Simplified Category Management:</strong> This new system uses the database exclusively 
          for category management. If you see duplicate categories, click "Clear Old Cache" below to remove 
          outdated localStorage entries.
        </AlertDescription>
      </Alert>

      {/* Clear cache button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Clean Up Old Settings
          </CardTitle>
          <CardDescription>
            Remove outdated category customizations stored in your browser cache.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={clearLocalStorageCategories}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Old Cache
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            This will remove all browser-stored category names and use only database categories.
          </p>
        </CardContent>
      </Card>

      {/* Main category manager */}
      <SimplifiedCategoryManager projectId={projectId} />
    </div>
  );
}