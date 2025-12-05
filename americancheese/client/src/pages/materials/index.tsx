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
import { getTier1CategoryColor } from "@/lib/unified-color-system";
import { useTheme } from "@/hooks/useTheme";

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

  // Get a consistent project color from current theme tier1 palette
  const getProjectColorHex = (id: number): string => {
    const tier1Colors = [
      currentTheme.tier1.subcategory1,
      currentTheme.tier1.subcategory2,
      currentTheme.tier1.subcategory3,
      currentTheme.tier1.subcategory4,
      currentTheme.tier1.subcategory5 || currentTheme.tier1.default,
    ];
    return tier1Colors[(id - 1) % tier1Colors.length];
  };

  // For legacy Tailwind arbitrary color border usage when needed
  const getProjectColorClass = (id: number): string => `border-[${getProjectColorHex(id)}]`;

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
              <Button 
                variant="ghost"
                className="bg-transparent border border-amber-600 text-amber-600 hover:bg-amber-50 font-medium h-9 px-4"
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4 text-amber-600" /> 
                Add Material
              </Button>
              
              {/* Show All Projects button on desktop only when a project is selected */}
              {projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-amber-50 text-amber-600 hover:text-amber-700 hover:bg-amber-100 border-amber-300 shadow-sm h-9 px-2"
                  onClick={() => handleProjectChange("all")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
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
          
          {/* Second row with project selector - full width like tasks page */}
          <div className="px-3 sm:px-4 pb-3 bg-orange-50 rounded-b-lg">
            {/* Desktop - Project selector gets full width */}
            <div className="hidden sm:block mb-3">
              <ProjectSelector 
                selectedProjectId={projectId} 
                onChange={handleProjectChange}
                className="border-0 rounded-none focus:ring-0 w-full"
                theme="orange"
              />
            </div>
            
            {/* Mobile - Project selector gets full width */}
            <div className="sm:hidden flex flex-col gap-2 mb-3">
              <ProjectSelector 
                selectedProjectId={projectId} 
                onChange={handleProjectChange}
                className="w-full border-0 rounded-none focus:ring-0"
                theme="orange"
              />
              {/* Show All Projects button on mobile only when a project is selected */}
              {projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-amber-50 text-amber-600 hover:text-amber-700 hover:bg-amber-100 border-amber-300 shadow-sm w-full"
                  onClick={() => handleProjectChange("all")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Projects
                </Button>
              )}
            </div>
            
            {/* Search bar */}
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
        </div>
        
        {/* Show selected project banner if a project is selected - matching task page header */}
        {projectId && (
          <div className="p-4 sm:p-5 mb-4 bg-gradient-to-r from-amber-50 to-orange-100 border-b border-amber-200 rounded-lg shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start sm:items-center gap-2 flex-1">
                <div className="h-full w-1 rounded-full bg-amber-500 mr-2 self-stretch hidden sm:block"></div>
                <div className="w-1 h-12 rounded-full bg-amber-500 mr-2 self-start block sm:hidden"></div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 leading-tight">
                    {getProjectName(projectId)}
                  </h3>
                  <div className="flex items-center text-sm text-slate-600 mt-1">
                    <Building className="h-4 w-4 mr-1" />
                    Materials for this project
                  </div>
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
