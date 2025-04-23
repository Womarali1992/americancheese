import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Layers, Building, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageTitle from "@/components/layout/page-title";
import CategoryManager from "@/components/admin/category-manager";
import TemplateManager from "@/components/admin/template-manager";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [location, setLocation] = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  // Fetch projects for the project selector
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    }
  });

  // Set the first project as selected when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  // Function to create a sample project
  const createSampleProject = async () => {
    try {
      const response = await fetch('/api/create-sample-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create sample project');
      }
      
      const result = await response.json();
      alert(result.message);
      
      // Refresh the projects list
      window.location.reload();
    } catch (error) {
      console.error('Error creating sample project:', error);
      alert('Failed to create sample project. See console for details.');
    }
  };

  // Get the selected project data
  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageTitle 
        title="Admin Panel" 
        subtitle="Manage task templates and categories for your projects"
        icon="settings-4-line"
      />

      {/* Project Selector Section */}
      <div className="mb-8 mt-6 bg-card p-6 rounded-lg border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 w-full md:w-auto">
            {isLoadingProjects ? (
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
            ) : projects.length === 0 ? (
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">No projects available</p>
                <Button onClick={() => setLocation('/projects/new')}>
                  Create Project
                </Button>
                <Button variant="outline" onClick={createSampleProject}>
                  Create Sample Project
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Select Project to Manage
                </label>
                <Select
                  value={selectedProjectId?.toString()}
                  onValueChange={(value) => setSelectedProjectId(Number(value))}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <Button onClick={() => setLocation('/projects/new')}>
                New Project
              </Button>
              <Button variant="outline" onClick={createSampleProject}>
                Add Sample Project
              </Button>
            </div>
          )}
        </div>
        
        {selectedProject && (
          <div className="mt-4 p-4 border rounded-lg bg-background">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <h3 className="text-lg font-semibold">{selectedProject.name}</h3>
                <p className="text-muted-foreground text-sm">{selectedProject.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedProject.status === 'active' ? 'default' : 'secondary'}>
                  {selectedProject.status}
                </Badge>
                {selectedProject.selectedTemplates && (
                  <Badge variant="outline">
                    {selectedProject.selectedTemplates.length} templates selected
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Section */}
      <div className="my-6">
        <Tabs 
          defaultValue={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
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
            {selectedProjectId ? (
              <CategoryManager projectId={selectedProjectId} />
            ) : (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <p>Please select a project to manage categories</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            {selectedProjectId ? (
              <TemplateManager projectId={selectedProjectId} />
            ) : (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <p>Please select a project to manage templates</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}