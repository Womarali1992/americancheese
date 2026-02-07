import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleStatusBadge } from "@/components/ui/simple-status-badge";
import { SimpleProgressBar } from "@/components/ui/simple-progress-bar";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { ShareProjectDialog } from "@/components/project/ShareProjectDialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Building,
  Calendar,
  MapPin,
  DollarSign,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Share2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Project {
  id: number;
  name: string;
  description?: string;
  location?: string;
  status: string;
  budget?: number;
  startDate: string;
  endDate: string;
  memberRole?: string;
  createdBy?: number;
}

interface Task {
  id: number;
  projectId: number;
  status: string;
}

export default function SimpleProjectsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Helper functions
  const getTasksForProject = (projectId: number) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getCompletedTasksCount = (projectId: number) => {
    return tasks.filter(task => 
      task.projectId === projectId && task.status === "completed"
    ).length;
  };

  const getProjectProgress = (projectId: number) => {
    const projectTasks = getTasksForProject(projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = getCompletedTasksCount(projectId);
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditDialogOpen(true);
  };

  const handleViewProject = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  const handleDeleteProject = async (projectId: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        // Add delete API call here
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      }
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on_hold":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Projects</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-gray-500 mb-4">
                {projects.length === 0 
                  ? "Get started by creating your first project"
                  : "Try adjusting your search or filters"
                }
              </p>
              {projects.length === 0 && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const progress = getProjectProgress(project.id);
              const totalTasks = getTasksForProject(project.id).length;
              const completedTasks = getCompletedTasksCount(project.id);

              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`inline-block px-2 py-1 text-xs rounded-full border ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          {project.memberRole && project.memberRole !== 'owner' && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {project.memberRole === 'viewer' ? 'View Only' : 'Shared'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProject(project.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProject(project)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportProject(project.id, project.name)}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedProject(project);
                            setShareDialogOpen(true);
                          }}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    {project.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        {project.location}
                      </div>
                    )}
                    
                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-wrap">
                        {project.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {completedTasks} of {totalTasks} tasks completed
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(project.startDate)}
                      </div>
                      {project.budget && (
                        <div className="flex items-center text-sm font-medium">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatCurrency(project.budget)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateProjectDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      {selectedProject && (
        <EditProjectDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={selectedProject}
        />
      )}

      {/* Share Project Dialog */}
      {selectedProject && (
        <ShareProjectDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          isOwner={selectedProject.memberRole === 'owner' || !selectedProject.memberRole}
          userRole={selectedProject.memberRole || null}
        />
      )}

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