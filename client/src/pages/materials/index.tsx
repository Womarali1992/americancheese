import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ResourcesTab } from "@/components/project/ResourcesTab";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { CreateMaterialDialog } from "./CreateMaterialDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Building, Plus, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTier1CategoryColor } from "@/lib/color-utils-sync";
import { useTheme } from "@/components/ThemeProvider";

export default function MaterialsPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectIdFromUrl = params.projectId ? Number(params.projectId) : undefined;
  
  const [projectId, setProjectId] = useState<number | undefined>(projectIdFromUrl);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
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

  // Function to get project color based on ID (exactly like dashboard)
  const { currentTheme } = useTheme();
  
  const getProjectColor = (id: number): string => {
    // Use theme tier1 colors for projects instead of hardcoded values
    const themeColors = [
      `border-[${currentTheme.tier1.structural}]`, 
      `border-[${currentTheme.tier1.systems}]`,    
      `border-[${currentTheme.tier1.sheathing}]`,  
      `border-[${currentTheme.tier1.finishings}]`, 
      `border-[${currentTheme.tier1.default}]`     
    ];

    // Use modulo to cycle through colors (ensures every project gets a color)
    return themeColors[(id - 1) % themeColors.length];
  };

  return (
    <Layout title="Materials & Inventory">
      <div className="space-y-2 p-4">
        <div className="bg-white border-2 border-amber-500 rounded-lg shadow-sm">
          {/* First row with title and buttons */}
          <div className="flex justify-between items-center p-3 sm:p-4 bg-orange-50 rounded-t-lg">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-amber-600">Materials</h1>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {/* Project selector on desktop */}
              <div className="w-[180px]">
                <ProjectSelector 
                  selectedProjectId={projectId} 
                  onChange={handleProjectChange}
                  className="bg-transparent border-0 rounded-none focus:ring-0"
                  theme="orange"
                />
              </div>
              
              {/* Show All Projects button on desktop only when a project is selected */}
              {projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-amber-50 text-amber-600 hover:text-amber-700 hover:bg-amber-100 border-2 border-amber-500 shadow-sm h-9"
                  onClick={() => handleProjectChange("all")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Projects
                </Button>
              )}
              
              <Button 
                className="bg-amber-600 text-white hover:bg-amber-700 font-medium shadow-sm h-9 px-4"
                onClick={() => setCreateDialogOpen(true)}
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
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 text-white" /> 
              </Button>
            </div>
          </div>
          
          {/* Second row with search bar */}
          <div className="px-3 sm:px-4 pb-3 bg-orange-50 rounded-b-lg">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-amber-600" />
              <Input 
                placeholder="Search materials..." 
                className="w-full pl-9 border-amber-300 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 rounded-md hover:bg-amber-50"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4 text-amber-600" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Project selector on mobile */}
          <div className="px-3 pb-3 flex flex-col gap-2 sm:hidden">
            <div className="w-full">
              <ProjectSelector 
                selectedProjectId={projectId} 
                onChange={handleProjectChange}
                className="w-full bg-transparent border-0 rounded-none focus:ring-0"
                theme="orange"
              />
            </div>
            {/* Show All Projects button on mobile only when a project is selected */}
            {projectId && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-amber-50 text-amber-600 hover:text-amber-700 hover:bg-amber-100 border-amber-300 shadow-sm mt-2 w-full"
                onClick={() => handleProjectChange("all")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Projects
              </Button>
            )}
          </div>
        </div>
        
        {/* Show selected project banner if a project is selected - using dashboard project card header */}
        {projectId && (
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div 
              className="p-3 relative"
              style={{
                // Use earth tone gradient colors based on project ID with lightened effect (exactly like dashboard)
                background: (() => {
                  const color = getProjectColor(projectId).replace('border-[', '').replace(']', '');
                  // Add white and a subtle tint to create a lighter, more refined gradient
                  return `linear-gradient(to right, rgba(255,255,255,0.85), ${color}40), linear-gradient(to bottom, rgba(255,255,255,0.9), ${color}30)`;
                })(),
                borderBottom: `1px solid ${getProjectColor(projectId).replace('border-[', '').replace(']', '')}`
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start flex-1">
                  <div className={`h-full w-1 rounded-full ${getProjectColor(projectId).replace('border', 'bg')} mr-3 self-stretch`}></div>
                  <div className="flex-1">
                    <div className="mb-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-800">{getProjectName(projectId)}</h3>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center text-sm text-slate-700 font-medium">
                        <Building className="h-4 w-4 mr-1 text-slate-600" />
                        Materials for this project
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full hover:bg-white hover:bg-opacity-70"
                    onClick={() => handleProjectChange("all")}
                  >
                    <span className="sr-only">Show all materials</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ResourcesTab projectId={projectId} hideTopButton={true} searchQuery={searchQuery} />
      </div>
      
      {/* Create Material Dialog */}
      <CreateMaterialDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
      />
    </Layout>
  );
}