import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const handleProjectClick = (projectId: string) => {
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
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <Building className="h-4 w-4 text-project" />
      
      {includeAllOption && (
        <Badge 
          variant={selectedProjectId === "all" || !selectedProjectId ? "default" : "outline"} 
          className={`cursor-pointer transition-colors hover:bg-slate-200 ${
            selectedProjectId === "all" || !selectedProjectId 
              ? "bg-slate-800 text-white" 
              : "bg-slate-100 text-slate-700 border-slate-300"
          }`}
          onClick={() => handleProjectClick("all")}
        >
          All Projects
        </Badge>
      )}
      
      {projects.map((project) => (
        <Badge 
          key={project.id}
          variant={selectedProjectId?.toString() === project.id.toString() ? "default" : "secondary"}
          className={`cursor-pointer transition-colors hover:bg-blue-200 ${
            selectedProjectId?.toString() === project.id.toString()
              ? "bg-blue-800 text-white" 
              : "bg-blue-100 text-blue-800 border-blue-200"
          }`}
          onClick={() => handleProjectClick(project.id.toString())}
        >
          {project.name}
        </Badge>
      ))}
    </div>
  );
}