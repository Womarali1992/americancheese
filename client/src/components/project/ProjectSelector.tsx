import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Building } from "lucide-react";
import { useSelectedProject } from "@/hooks/useSelectedProject";

interface ProjectSelectorProps {
  selectedProjectId?: number | string;
  onChange: (projectId: string) => void;
  className?: string;
  includeAllOption?: boolean;
}

export function ProjectSelector({ 
  selectedProjectId, 
  onChange, 
  className = "", 
  includeAllOption = true 
}: ProjectSelectorProps) {
  const [, navigate] = useLocation();

  const { data: projects = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const handleProjectChange = (projectId: string) => {
    onChange(projectId);

    // If a specific project is selected, consider navigating to that project's detail page
    if (projectId !== "all" && projectId.toString() !== "0") {
      // If we're already on a project detail page, update the URL
      if (window.location.pathname.includes("/projects/")) {
        navigate(`/projects/${projectId}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`h-10 bg-slate-100 rounded animate-pulse ${className}`}></div>
    );
  }

  return (
    <Select 
      value={selectedProjectId?.toString() || "all"}
      onValueChange={handleProjectChange}
    >
      <SelectTrigger className={`bg-white border border-slate-300 ${className}`}>
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-project" />
          <SelectValue placeholder="Select project" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && (
          <SelectItem value="all">All Projects</SelectItem>
        )}
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id.toString()}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}