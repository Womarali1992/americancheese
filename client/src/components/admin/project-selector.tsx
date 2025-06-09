import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useSelectedProject } from "@/hooks/useSelectedProject";

interface ProjectSelectorProps {
  value?: number | null;
  onChange?: (projectId: number | null) => void;
}

interface Project {
  id: number;
  name: string;
  status: string;
}

export default function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const [location, setLocation] = useLocation();
  const { selectedProjectId, setSelectedProject, isLoading: isSessionLoading } = useSelectedProject();
  
  // Fetch projects
  const { data: projects = [], isLoading: isProjectsLoading, refetch } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    }
  });

  const isLoading = isProjectsLoading || isSessionLoading;

  // Use session-based project selection as the source of truth
  const currentProjectId = value !== undefined ? value : selectedProjectId;

  // Initialize project selection from session or default to first project
  useEffect(() => {
    if (projects.length > 0 && selectedProjectId === null) {
      const firstProjectId = projects[0].id;
      setSelectedProject(firstProjectId);
      if (onChange) {
        onChange(firstProjectId);
      }
    } else if (selectedProjectId !== null && onChange) {
      onChange(selectedProjectId);
    }
  }, [projects, selectedProjectId, setSelectedProject, onChange]);

  const handleProjectChange = (projectId: string) => {
    const numericId = projectId ? parseInt(projectId) : null;
    setSelectedProject(numericId);
    if (onChange) {
      onChange(numericId);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-12">Loading projects...</div>;
  }

  if (projects.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                No projects found. Please create a project first to manage templates.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setLocation('/projects/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
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
                    
                    await response.json();
                    refetch();
                  } catch (error) {
                    console.error('Error creating sample project:', error);
                    alert('Failed to create sample project');
                  }
                }}
              >
                Create Sample
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
      <div className="flex flex-col min-w-[260px]">
        <label className="text-sm font-medium mb-2">Select Project</label>
        <Select
          value={currentProjectId?.toString() || ""}
          onValueChange={handleProjectChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project: Project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name} {project.status === 'active' ? '(Active)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 self-end sm:self-auto">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
        <Button size="sm" onClick={() => setLocation('/projects/new')}>
          <Plus className="h-4 w-4 mr-1" />
          New Project
        </Button>
      </div>
    </div>
  );
}