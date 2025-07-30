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
  theme?: 'green' | 'orange';
}

export function ProjectSelector({ 
  selectedProjectId, 
  onChange, 
  className = "", 
  includeAllOption = true,
  theme = 'green'
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

  // Theme-based color helpers
  const getContainerBg = () => theme === 'orange' ? 'bg-orange-50' : 'bg-green-50';
  const getHoverColor = () => theme === 'orange' ? 'hover:bg-orange-200' : 'hover:bg-green-200';
  const getSelectedColors = () => theme === 'orange' ? 'bg-orange-800 text-white' : 'bg-green-800 text-white';
  const getUnselectedColors = () => theme === 'orange' 
    ? 'bg-orange-100 text-orange-700 border-orange-300' 
    : 'bg-green-100 text-green-700 border-green-300';
  const getProjectUnselectedColors = () => theme === 'orange'
    ? 'bg-orange-100 text-orange-800 border-orange-200'
    : 'bg-green-100 text-green-800 border-green-200';

  if (isLoading) {
    return (
      <div className={`h-10 bg-slate-100 rounded animate-pulse ${className}`}></div>
    );
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${getContainerBg()} p-2 rounded-lg ${className}`}>
      <Building className="h-4 w-4 text-project" />
      
      {includeAllOption && (
        <Badge 
          variant={selectedProjectId === "all" || !selectedProjectId ? "default" : "outline"} 
          className={`cursor-pointer transition-colors ${getHoverColor()} ${
            selectedProjectId === "all" || !selectedProjectId 
              ? getSelectedColors()
              : getUnselectedColors()
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
          className={`cursor-pointer transition-colors ${getHoverColor()} ${
            selectedProjectId?.toString() === project.id.toString()
              ? getSelectedColors()
              : getProjectUnselectedColors()
          }`}
          onClick={() => handleProjectClick(project.id.toString())}
        >
          {project.name}
        </Badge>
      ))}
    </div>
  );
}