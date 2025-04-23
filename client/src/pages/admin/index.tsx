import { useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Layers } from 'lucide-react';
import PageTitle from "@/components/layout/page-title";
import CategoryManager from "@/components/admin/category-manager";
import TemplateManager from "@/components/admin/template-manager";
import ProjectSelector from "@/components/admin/project-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [location, setLocation] = useLocation();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageTitle 
        title="Admin Panel" 
        subtitle="Manage task templates and categories for each project"
        icon="settings-4-line"
      />

      <div className="mt-8">
        {/* Project selector at the top level */}
        <h2 className="text-xl font-semibold mb-4">Project Configuration</h2>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            First select a project, then configure its categories and templates. Each project can have a customized set of task categories and templates.
          </AlertDescription>
        </Alert>
        
        <ProjectSelector 
          value={selectedProjectId} 
          onChange={setSelectedProjectId} 
        />
        
        {selectedProjectId && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 w-full justify-start">
              <TabsTrigger value="categories">
                <Settings className="w-4 h-4 mr-2" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="templates">
                <Layers className="w-4 h-4 mr-2" />
                Task Templates
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="categories" className="space-y-4">
              <CategoryManager projectId={selectedProjectId} />
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <TemplateManager projectId={selectedProjectId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}