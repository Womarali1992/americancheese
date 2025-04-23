import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Layers, Building } from 'lucide-react';
import PageTitle from "@/components/layout/page-title";
import CategoryManager from "@/components/admin/category-manager";
import TemplateManager from "@/components/admin/template-manager";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [location, setLocation] = useLocation();
  
  // Fetch projects for the projects tab
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageTitle 
        title="Admin Panel" 
        subtitle="Manage task templates, categories, and project templates"
        icon="settings-4-line"
      />

      <div className="mt-8">
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
            <TabsTrigger value="projects">
              <Building className="w-4 h-4 mr-2" />
              Project Templates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-4">
            <CategoryManager />
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <TemplateManager />
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-4">
            <div className="mb-6">
              <p className="text-muted-foreground">
                Select a project to manage its template selection. Each project can have its own set of templates.
              </p>
            </div>
            
            {isLoadingProjects ? (
              <div className="flex items-center justify-center h-40">
                <p>Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center p-6">
                    <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a project first to manage its template selection.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <Button onClick={() => setLocation('/projects/new')}>
                        Create New Project
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={async () => {
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
                        }}
                      >
                        Create Sample Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Available Projects</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => setLocation('/projects/new')}
                    >
                      Add Project
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline" 
                      onClick={async () => {
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
                      }}
                    >
                      Add Sample Project
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project: any) => (
                    <Card key={project.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>
                          {project.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                          {project.selectedTemplates && (
                            <Badge variant="outline">
                              {project.selectedTemplates.length} templates selected
                            </Badge>
                          )}
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => setLocation(`/admin/project-templates/${project.id}`)}
                        >
                          Manage Templates
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}