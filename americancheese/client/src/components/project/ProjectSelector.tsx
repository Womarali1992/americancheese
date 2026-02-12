import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Building, ChevronDown, ChevronUp, ChevronLeft, Folder, FolderPlus, Pencil, Trash2, FolderInput, FolderMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project, ProjectFolder } from "@/types";

interface ProjectSelectorProps {
  selectedProjectId?: number | string;
  onChange: (projectId: string) => void;
  className?: string;
  includeAllOption?: boolean;
  theme?: 'green' | 'orange' | 'blue' | 'slate';
  onExpandedChange?: (expanded: boolean) => void;
}

export function ProjectSelector({
  selectedProjectId,
  onChange,
  className = "",
  includeAllOption = true,
  theme = 'green',
  onExpandedChange
}: ProjectSelectorProps) {
  const [, navigate] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [targetFolderId, setTargetFolderId] = useState<number | null>(null);

  const { toast } = useToast();

  const handleExpandedChange = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
    onExpandedChange?.(expanded);
    if (!expanded) {
      setActiveFolderId(null);
    }
  }, [onExpandedChange]);

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery<ProjectFolder[]>({
    queryKey: ["/api/project-folders"],
  });

  const isLoading = projectsLoading || foldersLoading;

  // Pre-compute folder-to-project mappings once (O(P) instead of O(F*P))
  const projectsByFolder = useMemo(() => {
    const map = new Map<number | null, Project[]>();
    for (const p of projects) {
      const key = p.folderId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [projects]);

  const unfiledProjects = useMemo(() => projectsByFolder.get(null) ?? [], [projectsByFolder]);
  const folderProjects = useMemo(
    () => activeFolderId ? (projectsByFolder.get(activeFolderId) ?? []) : [],
    [projectsByFolder, activeFolderId]
  );

  const handleProjectClick = useCallback((projectId: string) => {
    onChange(projectId);
    if (projectId !== "all" && projectId.toString() !== "0") {
      if (window.location.pathname.includes("/projects/")) {
        navigate(`/projects/${projectId}`);
      }
    }
  }, [onChange, navigate]);

  // Folder mutations with error handling
  const createFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await apiRequest("/api/project-folders", "POST", { name: folderName.trim() });
      queryClient.invalidateQueries({ queryKey: ["/api/project-folders"] });
      setFolderName("");
      setCreateFolderOpen(false);
    } catch {
      toast({ title: "Failed to create folder", variant: "destructive" });
    }
  };

  const renameFolder = async () => {
    if (!folderName.trim() || !targetFolderId) return;
    try {
      await apiRequest(`/api/project-folders/${targetFolderId}`, "PATCH", { name: folderName.trim() });
      queryClient.invalidateQueries({ queryKey: ["/api/project-folders"] });
      setFolderName("");
      setRenameFolderOpen(false);
      setTargetFolderId(null);
    } catch {
      toast({ title: "Failed to rename folder", variant: "destructive" });
    }
  };

  const deleteFolder = async () => {
    if (!targetFolderId) return;
    try {
      await apiRequest(`/api/project-folders/${targetFolderId}`, "DELETE");
      queryClient.invalidateQueries({ queryKey: ["/api/project-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      if (activeFolderId === targetFolderId) setActiveFolderId(null);
      setDeleteFolderOpen(false);
      setTargetFolderId(null);
    } catch {
      toast({ title: "Failed to delete folder", variant: "destructive" });
    }
  };

  const moveProjectToFolder = async (projectId: number, folderId: number | null) => {
    try {
      await apiRequest(`/api/projects/${projectId}/folder`, "PATCH", { folderId });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    } catch {
      toast({ title: "Failed to move project", variant: "destructive" });
    }
  };

  // Theme-based color helpers (memoized on theme prop)
  const themeColors = useMemo(() => {
    const t = theme;
    return {
      containerBg: t === 'orange' ? 'bg-orange-50' : t === 'blue' ? 'bg-blue-50' : t === 'slate' ? 'bg-slate-100' : 'bg-green-50',
      hover: t === 'orange' ? 'hover:bg-orange-200' : t === 'blue' ? 'hover:bg-blue-200' : t === 'slate' ? 'hover:bg-slate-200' : 'hover:bg-green-200',
      selected: t === 'orange' ? 'bg-orange-800 text-white' : t === 'blue' ? 'bg-blue-800 text-white' : t === 'slate' ? 'bg-slate-700 text-white' : 'bg-green-800 text-white',
      unselected: t === 'orange' ? 'bg-white text-orange-700 border-orange-300' : t === 'blue' ? 'bg-white text-blue-700 border-blue-300' : t === 'slate' ? 'bg-white text-slate-700 border-slate-300' : 'bg-white text-green-700 border-green-300',
      projectUnselected: t === 'orange' ? 'bg-white text-orange-800 border-orange-200' : t === 'blue' ? 'bg-white text-blue-800 border-blue-200' : t === 'slate' ? 'bg-white text-slate-800 border-slate-200' : 'bg-white text-green-800 border-green-200',
      folder: t === 'orange' ? 'bg-orange-100 text-orange-900 border-orange-300' : t === 'blue' ? 'bg-blue-100 text-blue-900 border-blue-300' : t === 'slate' ? 'bg-slate-200 text-slate-900 border-slate-400' : 'bg-green-100 text-green-900 border-green-300',
      addFolder: t === 'orange' ? 'bg-transparent text-orange-500 border-orange-300 border-dashed' : t === 'blue' ? 'bg-transparent text-blue-500 border-blue-300 border-dashed' : t === 'slate' ? 'bg-transparent text-slate-500 border-slate-300 border-dashed' : 'bg-transparent text-green-500 border-green-300 border-dashed',
      border: t === 'orange' ? '#f97316' : t === 'blue' ? '#3b82f6' : t === 'slate' ? '#64748b' : '#22c55e',
    };
  }, [theme]);

  const selectedProject = useMemo(
    () => projects.find(p => p.id.toString() === selectedProjectId?.toString()),
    [projects, selectedProjectId]
  );
  const activeFolder = useMemo(
    () => folders.find(f => f.id === activeFolderId),
    [folders, activeFolderId]
  );

  if (isLoading) {
    return (
      <div className={`h-10 bg-slate-100 rounded animate-pulse ${className}`}></div>
    );
  }

  // Render a project badge with context menu
  const renderProjectBadge = (project: Project) => (
    <ContextMenu key={project.id}>
      <ContextMenuTrigger>
        <Badge
          variant={selectedProjectId?.toString() === project.id.toString() ? "default" : "secondary"}
          className={`cursor-pointer transition-colors ${themeColors.hover} ${
            selectedProjectId?.toString() === project.id.toString()
              ? themeColors.selected
              : themeColors.projectUnselected
          }`}
          onClick={() => handleProjectClick(project.id.toString())}
        >
          {project.name}
        </Badge>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="h-3.5 w-3.5 mr-2" />
            Move to Folder
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {folders.map(folder => (
              <ContextMenuItem
                key={folder.id}
                onClick={() => moveProjectToFolder(project.id, folder.id)}
                disabled={project.folderId === folder.id}
              >
                <Folder className="h-3.5 w-3.5 mr-2" />
                {folder.name}
              </ContextMenuItem>
            ))}
            {folders.length === 0 && (
              <ContextMenuItem disabled>No folders yet</ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        {project.folderId && (
          <ContextMenuItem onClick={() => moveProjectToFolder(project.id, null)}>
            <FolderMinus className="h-3.5 w-3.5 mr-2" />
            Remove from Folder
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );

  // Render a folder badge with context menu
  const renderFolderBadge = (folder: ProjectFolder) => {
    const projectCount = (projectsByFolder.get(folder.id) ?? []).length;
    return (
      <ContextMenu key={folder.id}>
        <ContextMenuTrigger>
          <Badge
            variant="outline"
            className={`cursor-pointer transition-colors ${themeColors.hover} ${themeColors.folder} flex items-center gap-1`}
            onClick={() => setActiveFolderId(folder.id)}
          >
            <Folder className="h-3 w-3" />
            {folder.name}
            <span className="text-xs opacity-60">({projectCount})</span>
          </Badge>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => {
            setTargetFolderId(folder.id);
            setFolderName(folder.name);
            setRenameFolderOpen(true);
          }}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => {
              setTargetFolderId(folder.id);
              setDeleteFolderOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <>
      <div
        className={`${themeColors.containerBg} p-2 rounded-lg w-full ${className}`}
        onMouseEnter={() => handleExpandedChange(true)}
        onMouseLeave={() => handleExpandedChange(false)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Building className="h-4 w-4 text-project" />

          {includeAllOption && (
            <Badge
              variant={selectedProjectId === "all" || !selectedProjectId ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${themeColors.hover} ${
                selectedProjectId === "all" || !selectedProjectId
                  ? themeColors.selected
                  : themeColors.unselected
              }`}
              onClick={() => {
                handleProjectClick("all");
                setActiveFolderId(null);
              }}
            >
              All Projects
            </Badge>
          )}

          {/* Show selected project badge when collapsed and a project is selected */}
          {!isExpanded && selectedProject && (
            <Badge
              variant="default"
              className={`cursor-pointer transition-colors ${themeColors.selected}`}
              onClick={() => handleProjectClick(selectedProject.id.toString())}
            >
              {selectedProject.name}
            </Badge>
          )}

          {/* Show active folder name when collapsed */}
          {!isExpanded && activeFolder && !selectedProject && (
            <Badge
              variant="outline"
              className={`${themeColors.folder} flex items-center gap-1`}
            >
              <Folder className="h-3 w-3" />
              {activeFolder.name}
            </Badge>
          )}

          {/* Expand/Collapse indicator - clickable for keyboard accessibility */}
          <Badge
            variant="outline"
            className={`cursor-pointer transition-colors ${themeColors.hover} ${themeColors.unselected} flex items-center gap-1`}
            onClick={() => handleExpandedChange(!isExpanded)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleExpandedChange(!isExpanded); } }}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <>
                {projects.length} Projects <ChevronDown className="h-3 w-3" />
              </>
            )}
          </Badge>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-opacity-20" style={{ borderColor: themeColors.border }}>
            {activeFolderId ? (
              <>
                {/* Inside a folder view */}
                <Badge
                  variant="outline"
                  className={`cursor-pointer transition-colors ${themeColors.hover} ${themeColors.unselected} flex items-center gap-1`}
                  onClick={() => setActiveFolderId(null)}
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back
                </Badge>
                <span className="text-sm font-medium flex items-center gap-1 px-1" style={{ color: themeColors.border }}>
                  <Folder className="h-3.5 w-3.5" />
                  {activeFolder?.name}
                </span>
                {folderProjects.length > 0 ? (
                  folderProjects.map(renderProjectBadge)
                ) : (
                  <span className="text-xs text-gray-400 italic">No projects in this folder</span>
                )}
              </>
            ) : (
              <>
                {/* Root level: folders + unfiled projects */}
                {folders.map(renderFolderBadge)}

                {/* + Folder button */}
                <Badge
                  variant="outline"
                  className={`cursor-pointer transition-colors ${themeColors.addFolder} flex items-center gap-1`}
                  onClick={() => {
                    setFolderName("");
                    setCreateFolderOpen(true);
                  }}
                >
                  <FolderPlus className="h-3 w-3" />
                  Folder
                </Badge>

                {/* Separator if there are both folders and unfiled projects */}
                {folders.length > 0 && unfiledProjects.length > 0 && (
                  <span className="text-gray-300 mx-1">|</span>
                )}

                {/* Unfiled projects */}
                {unfiledProjects.map(renderProjectBadge)}

                {/* Filed projects (shown at root only if no folders exist) */}
                {folders.length === 0 && projects.filter(p => p.folderId).map(renderProjectBadge)}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
            <Button onClick={createFolder} disabled={!folderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameFolderOpen} onOpenChange={setRenameFolderOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && renameFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFolderOpen(false)}>Cancel</Button>
            <Button onClick={renameFolder} disabled={!folderName.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation */}
      <AlertDialog open={deleteFolderOpen} onOpenChange={setDeleteFolderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Projects inside this folder will become unfiled. They will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFolder} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
