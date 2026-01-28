import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getProjectTheme, PROJECT_THEMES } from "@/lib/project-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressBar } from "@/components/charts/ProgressBar";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { StatusBadge } from "@/components/ui/status-badge";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Search, Plus, Building, Pencil, Trash2, Package, Download, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types";

interface ProjectWithId extends Project {
  id: number;
}

interface Material {
  id: number;
  projectId: number;
  name: string;
  quantity: number;
  cost?: number;
  category: string;
  type: string;
  supplier?: string;
}

// Mock users for avatar group
const mockUsers = [
  { name: "John Doe", image: undefined },
  { name: "Jane Smith", image: undefined },
  { name: "Robert Chen", image: undefined },
];

export default function ProjectsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isImporting, setIsImporting] = useState(false);

  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<ProjectWithId[]>({
    queryKey: ["/api/projects"],
  });
  
  // Fetch all materials to count them by project
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Count materials by project
  const getMaterialCountForProject = (projectId: number) => {
    return materials.filter((material) => material.projectId === projectId).length;
  };

  // Filter projects based on search query and status
  const filteredProjects = projects.filter((project: ProjectWithId) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.location ? project.location.toLowerCase().includes(searchQuery.toLowerCase()) : false);
    
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = () => {
    setCreateDialogOpen(true);
  };

  const handleExportProject = async (projectId: number, projectName: string) => {
    try {
      // Export as JSON (v2.0 format with categories)
      const response = await fetch(`/api/projects/${projectId}/export?format=json`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Project exported successfully (JSON format with categories)",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export project",
        variant: "destructive",
      });
    }
  };

  const handleImportProject = async (file: File) => {
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/projects/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Import failed');
      }

      const result = await response.json();

      // Refresh projects list
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });

      const categoriesMsg = result.stats.categories
        ? `, ${result.stats.categories.tier1 || 0} tier1 and ${result.stats.categories.tier2 || 0} tier2 categories`
        : '';
      toast({
        title: "Success",
        description: `Project "${result.project.name}" imported with ${result.stats.tasks} tasks, ${result.stats.materials} materials${categoriesMsg}`,
      });

      setImportDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import project",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Get project color based on theme - uses the same theme system as project detail page
  const getProjectCardStyle = (projectId: number, status: string) => {
    // Get the project from the projects data to check its theme settings
    const project = projects?.find(p => p.id === projectId);

    // Get project theme using the shared theme system
    const themeName = project?.colorTheme || 'Earth Tone';
    const projectTheme = getProjectTheme(themeName);

    // Use the project's primary theme color
    const themeColor = projectTheme.primary;

    // Convert hex to RGB for gradient
    const hexToRgb = (hex: string) => {
      const cleanHex = hex.trim().replace('#', '');
      const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 85, g: 107, b: 47 }; // fallback to earth tone
    };

    const rgb = hexToRgb(themeColor);

    // Create gradient style based on status
    if (status === "completed") {
      // Green tint for completed projects
      return {
        background: `linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(21, 128, 61, 0.9))`
      };
    } else if (status === "on_hold") {
      // Gray tint for on-hold projects
      return {
        background: `linear-gradient(135deg, rgba(107, 114, 128, 0.9), rgba(75, 85, 99, 0.9))`
      };
    } else {
      // Use theme color for active projects
      return {
        background: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9), rgba(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)}, 0.9))`
      };
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold hidden md:block">Projects</h2>
          <Button className="bg-project hover:bg-blue-600" onClick={handleCreateProject}>
            <Plus className="mr-1 h-4 w-4" />
            Create New Project
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          <Card className="bg-white">
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select defaultValue="all">
                  <SelectTrigger className="border border-slate-300 rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="recent">
                  <SelectTrigger className="border border-slate-300 rounded-lg">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                    <SelectItem value="budget_high">Budget: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-36 bg-slate-200"></div>
                <CardContent className="p-4 space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="flex justify-between">
                    <div className="h-10 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-10 bg-slate-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold hidden md:block">Projects</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-1 h-4 w-4" />
            Import
          </Button>
          <Button className="bg-project hover:bg-blue-600" onClick={handleCreateProject}>
            <Plus className="mr-1 h-4 w-4" />
            Create New Project
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search projects..."
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border border-slate-300 rounded-lg">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="recent">
                <SelectTrigger className="border border-slate-300 rounded-lg">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="name_asc">Name A-Z</SelectItem>
                  <SelectItem value="budget_high">Budget: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {filteredProjects?.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No projects found</h3>
            <p className="mt-2 text-sm text-slate-500">Get started by creating a new project</p>
            <Button className="mt-4 bg-project hover:bg-blue-600" onClick={handleCreateProject}>
              <Plus className="mr-1 h-4 w-4" />
              Create New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects?.map((project) => (
              <Card 
                key={project.id} 
                className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div 
                  className="h-36 relative"
                  style={getProjectCardStyle(project.id, project.status)}
                >
                  <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-md px-2 py-1 text-xs font-medium">
                    <StatusBadge status={project.status} />
                  </div>
                  {/* Material count badge */}
                  <div className="absolute bottom-3 right-3 bg-white bg-opacity-90 rounded-md px-2 py-1 text-xs font-medium flex items-center">
                    <Package className="h-3 w-3 mr-1" />
                    <span>{getMaterialCountForProject(project.id)} Materials</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{project.location}</p>
                  
                  <div className="flex justify-between text-sm mb-4">
                    <div>
                      <p className="text-slate-500">Start Date</p>
                      <p className="font-medium">{formatDate(project.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">End Date</p>
                      <p className="font-medium">{formatDate(project.endDate)}</p>
                    </div>
                  </div>
                  
                  <ProgressBar value={project.progress || 0} className="mb-3" />
                  
                  <div className="flex justify-between items-center">
                    <AvatarGroup users={mockUsers} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the card click event
                          }}
                        >
                          <MoreHorizontal className="h-5 w-5 text-slate-500 hover:text-slate-700" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportProject(project.id, project.name);
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
                              fetch(`/api/projects/${project.id}`, {
                                method: "DELETE",
                              })
                                .then(res => {
                                  if (res.ok) {
                                    toast({
                                      title: "Project Deleted",
                                      description: "The project has been successfully deleted.",
                                    });
                                    // Refetch projects
                                    window.location.reload();
                                  } else {
                                    throw new Error("Failed to delete project");
                                  }
                                })
                                .catch(err => {
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete the project. Please try again.",
                                    variant: "destructive",
                                  });
                                  console.error(err);
                                });
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={selectedProject}
      />

      {/* Import Project Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Project</DialogTitle>
            <DialogDescription>
              Upload a CSV file exported from another project to create a copy with all tasks, materials, labor, and contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop a CSV file here, or click to browse
              </p>
              <Input
                type="file"
                accept=".json,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportProject(file);
                }}
                disabled={isImporting}
                className="max-w-xs mx-auto"
              />
            </div>
            {isImporting && (
              <div className="text-center text-sm text-gray-600">
                Importing project... This may take a moment.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
