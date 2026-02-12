import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ResourcesTabNew } from "@/components/project/ResourcesTabNew";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { CreateMaterialDialog } from "./CreateMaterialDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Building, Plus, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTier1CategoryColor } from "@/lib/unified-color-system";
import { useTheme } from "@/hooks/useTheme";
import { useNavPills } from "@/hooks/useNavPills";
import { useNav } from "@/contexts/NavContext";

export default function MaterialsPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectIdFromUrl = params.projectId ? Number(params.projectId) : undefined;

  const [projectId, setProjectId] = useState<number | undefined>(projectIdFromUrl);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);

  // Inject nav pills and actions for TopNav
  useNavPills("materials");
  const { setActions } = useNav();

  useEffect(() => {
    setActions(
      <>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search materials..."
            className="pl-9 h-9 w-48 bg-white border-slate-200 shadow-sm rounded-lg text-sm"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="h-9 bg-orange-600 hover:bg-orange-700 text-white shadow-sm rounded-lg px-3 text-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Material
        </Button>
      </>
    );
    return () => { setActions(null); };
  }, [searchQuery, setActions]);

  // Callback to track category selection from ResourcesTabNew
  const handleCategoryChange = (tier1: string | null, tier2: string | null) => {
    setSelectedTier1(tier1);
    setSelectedTier2(tier2);
  };

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
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Title & Project Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#8b4513] to-[#a0522d] bg-clip-text text-transparent shrink-0">
                Materials
              </h1>
              <div className="w-full sm:max-w-md">
                <ProjectSelector
                  selectedProjectId={projectId}
                  onChange={handleProjectChange}
                  className="w-full border-slate-200 focus:ring-[#8b4513]"
                  theme="slate"
                />
              </div>
            </div>

            {/* Right: Actions & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search materials..."
                  className="w-full pl-9 bg-slate-50 border-slate-200 focus:border-[#8b4513] focus:ring-[#8b4513] h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0 rounded-md hover:bg-slate-200"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3 text-slate-500" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {projectId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-slate-600 hover:text-[#8b4513] hover:bg-orange-50 border-slate-200"
                    onClick={() => handleProjectChange("all")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    All Projects
                  </Button>
                )}
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="h-9 bg-[#8b4513] hover:bg-[#6b3410] text-white shadow-sm flex-1 sm:flex-none"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Material
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Show selected project banner if a project is selected - matching task page header */}
        {projectId && (
          <div className="px-4 py-3 mb-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-slate-800" style={{ backgroundColor: getProjectColorHex(projectId) }}></div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 leading-none">
                  {getProjectName(projectId)}
                </h3>
                <div className="flex items-center text-xs text-slate-500 mt-1">
                  <Building className="h-3 w-3 mr-1" />
                  Project Materials
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Optional: Add project-specific actions here later if needed */}
            </div>
          </div>
        )}

        <ResourcesTabNew projectId={projectId} searchQuery={searchQuery} onCategoryChange={handleCategoryChange} />
      </div>

      {/* Create Material Dialog */}
      <CreateMaterialDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        initialTier1={selectedTier1 || undefined}
        initialTier2={selectedTier2 || undefined}
      />
    </Layout>
  );
}
