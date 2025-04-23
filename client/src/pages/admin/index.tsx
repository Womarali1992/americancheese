import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/layout/page-title";
import CategoryManager from "@/components/admin/category-manager";
import TemplateManager from "@/components/admin/template-manager";
import { Button } from "@/components/ui/button";
import { Database, FileJson, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminPage() {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImportTemplates = async () => {
    setIsImporting(true);
    try {
      const response = await apiRequest(
        "/api/admin/migrate-task-templates", 
        "POST"
      );
      
      const data = await response.json();
      toast({
        title: "Templates imported successfully",
        description: `Created: ${data.created}, Skipped: ${data.skipped}, Total: ${data.total}`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error importing templates:", error);
      toast({
        title: "Failed to import templates",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageTitle 
        title="Admin Panel" 
        subtitle="Manage task templates and categories"
        icon="settings"
      />

      <Card>
        <CardHeader>
          <CardTitle>Template Management</CardTitle>
          <CardDescription>
            Configure task templates and categories for projects
          </CardDescription>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportTemplates}
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              {isImporting ? "Importing..." : "Import Templates"}
              {isImporting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href="/api/admin/task-templates" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                View Template API
                <Database className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="categories" className="space-y-4">
            <TabsList>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="categories" className="space-y-4">
              <CategoryManager />
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <TemplateManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}