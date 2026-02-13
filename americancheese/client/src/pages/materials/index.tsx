import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ResourcesTabNew } from "@/components/project/ResourcesTabNew";
import { CreateMaterialDialog } from "./CreateMaterialDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, Plus, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavPills } from "@/hooks/useNavPills";

export default function MaterialsPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectIdFromUrl = params.projectId ? Number(params.projectId) : undefined;

  const [projectId, setProjectId] = useState<number | undefined>(projectIdFromUrl);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<number | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Inject nav pills for TopNav
  useNavPills("materials");

  // Callback to track category selection from ResourcesTabNew
  const handleCategoryChange = (tier1: string | null, tier2: string | null) => {
    setSelectedTier1(tier1);
    setSelectedTier2(tier2);
  };

  // Fetch projects for the breadcrumb/header
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: projectFolders = [] } = useQuery<any[]>({
    queryKey: ["/api/project-folders"],
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

  return (
    <Layout title="Materials & Inventory">
      <div className="space-y-3 w-full min-w-0">
        {/* Unified Header Card */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm w-full min-w-0 overflow-x-hidden"
          onMouseLeave={() => setHoveredFolderId(null)}
        >
          {/* Row 1: Title + Folder badges + Controls */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#ea580c] to-[#c2410c] bg-clip-text text-transparent flex-shrink-0">Materials</h1>

            {/* Folder badges */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {projectFolders.map((folder: any) => {
                const folderProjectCount = projects.filter((p: any) => p.folderId === folder.id).length;
                const isHovered = hoveredFolderId === folder.id;
                const hasSelectedProject = projectId !== undefined && projects.find((p: any) => p.id === projectId)?.folderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    className="relative"
                    onMouseEnter={() => setHoveredFolderId(folder.id)}
                  >
                    <button
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        hasSelectedProject
                          ? 'bg-orange-600 text-white border-orange-600'
                          : isHovered
                            ? 'bg-orange-50 text-orange-600 border-orange-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-orange-600 hover:text-orange-600'
                      }`}
                    >
                      <Folder className="h-3 w-3" />
                      {folder.name}
                      <span className="opacity-60">({folderProjectCount})</span>
                    </button>
                  </div>
                );
              })}
              {/* Unfiled projects badge */}
              {(() => {
                const unfiledCount = projects.filter((p: any) => !p.folderId).length;
                if (unfiledCount === 0) return null;
                const isHovered = hoveredFolderId === -1;
                const hasSelectedProject = projectId !== undefined && !projects.find((p: any) => p.id === projectId)?.folderId;
                return (
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredFolderId(-1)}
                  >
                    <button
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        hasSelectedProject
                          ? 'bg-orange-600 text-white border-orange-600'
                          : isHovered
                            ? 'bg-orange-50 text-orange-600 border-orange-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-orange-600 hover:text-orange-600'
                      }`}
                    >
                      Unfiled
                      <span className="opacity-60">({unfiledCount})</span>
                    </button>
                  </div>
                );
              })()}

              {projectId !== undefined && (
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-orange-600 hover:bg-slate-50 transition-colors"
                  onClick={() => handleProjectChange("all")}
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Right-side controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Search */}
              {!searchExpanded ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-md hover:bg-orange-50 text-orange-600"
                  onClick={() => setSearchExpanded(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              ) : (
                <div className="relative w-44 sm:w-56">
                  <Search className="absolute left-3 top-2 h-4 w-4 text-orange-600" />
                  <Input
                    placeholder="Search materials..."
                    className="w-full pl-9 pr-9 border-slate-300 focus:border-orange-600 focus:ring-orange-600 rounded-lg h-8 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-0.5 h-7 w-7 rounded-md hover:bg-slate-100"
                    onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}
                  >
                    <X className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                </div>
              )}

              {/* Add Material */}
              <Button
                variant="ghost"
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium h-8 px-3 sm:px-4 rounded-md shadow-sm text-xs"
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Add Material</span>
              </Button>
            </div>
          </div>

          {/* Hover dropdown: projects in selected folder */}
          {hoveredFolderId !== null && (() => {
            const folderProjects = hoveredFolderId === -1
              ? projects.filter((p: any) => !p.folderId)
              : projects.filter((p: any) => p.folderId === hoveredFolderId);
            if (folderProjects.length === 0) return null;
            return (
              <div className="px-3 sm:px-4 pb-3 flex items-center gap-1.5 flex-wrap border-t border-slate-100 pt-2">
                {folderProjects.map((project: any) => {
                  const isSelected = projectId === project.id;
                  return (
                    <button
                      key={project.id}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-600 hover:text-orange-600'
                      }`}
                      onClick={() => handleProjectChange(project.id.toString())}
                    >
                      {project.name}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

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
