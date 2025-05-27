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
        <div className="bg-white border-b-2 border-amber-500 p-3 sm:p-4 rounded-lg shadow-sm">
          {/* First row with title and buttons */}
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-amber-600">Materials</h1>
            <div className="hidden sm:flex items-center gap-2">
              {/* Project selector on desktop */}
              <div className="w-[180px]">
                <ProjectSelector 
                  selectedProjectId={projectId} 
                  onChange={handleProjectChange}
                  className="bg-white border-amber-300 rounded-lg focus:ring-amber-500"
                />
              </div>
              
              {/* Show All Projects button on desktop only when a project is selected */}
              {projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-amber-50 text-amber-600 hover:text-amber-700 hover:bg-amber-100 border-amber-300 shadow-sm h-9"
                  onClick={() => handleProjectChange("all")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Projects
                </Button>
              )}
              
              <Button 
                className="bg-amber-600 text-white hover:bg-amber-700 font-medium shadow-sm h-9 px-4"
                onClick={() => {
                  // Navigate to ResourcesTab and trigger the dialog
                  setLocation(`/projects/${projectId || "all"}/resources`);
                }}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4 text-white" /> 
                Add Material
              </Button>
            </div>
            
            {/* Add Material button on mobile */}
            <div className="sm:hidden flex items-center">
              <Button 
                className="bg-amber-600 text-white hover:bg-amber-700 font-medium shadow-sm h-9 px-3"
                onClick={() => {
                  // Navigate to ResourcesTab and trigger the dialog
                  setLocation(`/projects/${projectId || "all"}/resources`);
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 text-white" /> 
              </Button>
            </div>
          </div>
          
          {/* Project selector on mobile */}
          <div className="mt-3 flex flex-col gap-2 sm:hidden">
            <div className="w-full">
              <ProjectSelector 
                selectedProjectId={projectId} 
                onChange={handleProjectChange}
                className="w-full bg-white border-none rounded-lg focus:ring-amber-500"
              />
            </div>
            {/* Show All Projects button on mobile only when a project is selected */}
            {projectId && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white text-slate-600 hover:text-slate-800 border-slate-200 shadow-sm mt-2 w-full"
                onClick={() => handleProjectChange("all")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Projects
              </Button>
            )}
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