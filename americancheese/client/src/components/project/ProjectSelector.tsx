import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Building, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const handleExpandedChange = (expanded: boolean) => {
    setIsExpanded(expanded);
    onExpandedChange?.(expanded);
  };

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
  const getContainerBg = () => {
    if (theme === 'orange') return 'bg-orange-50';
    if (theme === 'blue') return 'bg-blue-50';
    if (theme === 'slate') return 'bg-slate-100';
    return 'bg-green-50';
  };
  
  const getHoverColor = () => {
    if (theme === 'orange') return 'hover:bg-orange-200';
    if (theme === 'blue') return 'hover:bg-blue-200';
    if (theme === 'slate') return 'hover:bg-slate-200';
    return 'hover:bg-green-200';
  };

  const getSelectedColors = () => {
    if (theme === 'orange') return 'bg-orange-800 text-white';
    if (theme === 'blue') return 'bg-blue-800 text-white';
    if (theme === 'slate') return 'bg-slate-700 text-white';
    return 'bg-green-800 text-white';
  };

  const getUnselectedColors = () => {
    if (theme === 'orange') return 'bg-white text-orange-700 border-orange-300';
    if (theme === 'blue') return 'bg-white text-blue-700 border-blue-300';
    if (theme === 'slate') return 'bg-white text-slate-700 border-slate-300';
    return 'bg-white text-green-700 border-green-300';
  };

  const getProjectUnselectedColors = () => {
    if (theme === 'orange') return 'bg-white text-orange-800 border-orange-200';
    if (theme === 'blue') return 'bg-white text-blue-800 border-blue-200';
    if (theme === 'slate') return 'bg-white text-slate-800 border-slate-200';
    return 'bg-white text-green-800 border-green-200';
  };

  if (isLoading) {
    return (
      <div className={`h-10 bg-slate-100 rounded animate-pulse ${className}`}></div>
    );
  }

  // Get the selected project name for display when collapsed
  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId?.toString());

  return (
    <div
      className={`${getContainerBg()} p-2 rounded-lg w-full ${className}`}
      onMouseEnter={() => handleExpandedChange(true)}
      onMouseLeave={() => handleExpandedChange(false)}
    >
      <div className="flex items-center gap-2 flex-wrap">
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

        {/* Show selected project badge when collapsed and a project is selected */}
        {!isExpanded && selectedProject && (
          <Badge
            variant="default"
            className={`cursor-pointer transition-colors ${getSelectedColors()}`}
            onClick={() => handleProjectClick(selectedProject.id.toString())}
          >
            {selectedProject.name}
          </Badge>
        )}

        {/* Expand/Collapse indicator */}
        <Badge
          variant="outline"
          className={`cursor-pointer transition-colors ${getHoverColor()} ${getUnselectedColors()} flex items-center gap-1`}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              {projects.length} Projects <ChevronDown className="h-3 w-3" />
            </>
          )}
        </Badge>
      </div>

      {/* Expanded project list */}
      {isExpanded && (
        <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-opacity-20" style={{ borderColor: theme === 'orange' ? '#f97316' : theme === 'blue' ? '#3b82f6' : theme === 'slate' ? '#64748b' : '#22c55e' }}>
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
      )}
    </div>
  );
}