import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ResourcesTab } from "@/components/project/ResourcesTab";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function MaterialsPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectIdFromUrl = params.projectId ? Number(params.projectId) : undefined;
  
  const [projectId, setProjectId] = useState<number | undefined>(projectIdFromUrl);
  
  // Fetch projects for the breadcrumb/header
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });
  
  // Update projectId when URL parameter changes
  useEffect(() => {
    if (projectIdFromUrl) {
      setProjectId(projectIdFromUrl);
    }
  }, [projectIdFromUrl]);
  
  // Handle project selection
  const handleProjectChange = (selectedId: string) => {
    if (selectedId === "all") {
      setProjectId(undefined);
      setLocation("/materials");
    } else {
      setProjectId(Number(selectedId));
      setLocation(`/materials?projectId=${selectedId}`);
    }
  };
  
  // Get project name for selected project
  const getProjectName = (id: number) => {
    const project = projects.find(p => p.id === id);
    return project ? project.name : "Unknown Project";
  };

  return (
    <Layout title="Materials & Inventory">
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-start">
          <h1 className="page-header text-slate-900">Materials</h1>
          <div className="flex flex-col items-end gap-2">
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm"
              onClick={() => {
                // Navigate to ResourcesTab and trigger the dialog
                setLocation(`/projects/${projectId || "all"}/resources`);
              }}
            >
              <Plus className="mr-2 h-4 w-4 text-white" /> Add Material
            </Button>
            <ProjectSelector
              selectedProjectId={projectId} 
              onChange={handleProjectChange}
              className="w-[180px] border-orange-500 rounded-lg focus:ring-orange-500"
            />
          </div>
        </div>
        
        {/* Show selected project banner if a project is selected */}
        {projectId && (
          <div className="flex items-center gap-2 px-3 py-2 bg-material bg-opacity-5 border border-material border-opacity-20 rounded-lg">
            <Building className="h-5 w-5 text-material" />
            <div>
              <h3 className="text-sm font-medium">{getProjectName(projectId)}</h3>
              <p className="text-xs text-muted-foreground">Materials for this project</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-slate-400 hover:text-slate-600" 
              onClick={() => handleProjectChange("all")}
            >
              <span className="sr-only">Show all materials</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <ResourcesTab projectId={projectId} hideTopButton={true} />
      </div>
    </Layout>
  );
}