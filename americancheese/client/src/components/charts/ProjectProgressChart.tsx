import React, { useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { Building, Cog, PanelTop, Sofa, ChevronDown, ChevronRight } from "lucide-react";

interface SystemProgress {
  name: string;
  value: number;
  icon: React.ReactNode;
  color: string; // Updated to support theme color values
}

interface ProjectProgressChartProps {
  projectId: number;
  projectName: string;
  progress: {
    structural: number;
    systems: number;
    sheathing: number;
    finishings: number;
  };
  className?: string;
  expanded?: boolean;
}

export function ProjectProgressChart({
  projectId,
  projectName,
  progress,
  className,
  expanded = false,
}: ProjectProgressChartProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Using theme-based colors for progress bars
  const systemProgress: SystemProgress[] = [
    { 
      name: "Structure", 
      value: progress.structural, 
      icon: <Building className="h-4 w-4 material-icon-structural" />,
      color: "structural" // Using themed CSS variable --tier1-structural
    },
    { 
      name: "Systems", 
      value: progress.systems, 
      icon: <Cog className="h-4 w-4 material-icon-systems" />,
      color: "systems" // Using themed CSS variable --tier1-systems
    },
    { 
      name: "Sheathing", 
      value: progress.sheathing, 
      icon: <PanelTop className="h-4 w-4 material-icon-sheathing" />,
      color: "sheathing" // Using themed CSS variable --tier1-sheathing
    },
    { 
      name: "Finishings", 
      value: progress.finishings, 
      icon: <Sofa className="h-4 w-4 material-icon-finishings" />,
      color: "finishings" // Using themed CSS variable --tier1-finishings
    },
  ];

  // Calculate total project progress (average of all systems)
  const totalProgress = Math.min(
    Math.max(
      Math.round(
        (progress.structural + progress.systems + progress.sheathing + progress.finishings) / 4
      ),
      0
    ),
    100
  );

  // Get the project color based on ID - now returns theme colors
  const getProjectColor = (id: number): string => {
    // Use the primary tier1 category color (structural) for the main progress bar
    // This ensures consistency with the theme system
    return "structural";
  };

  // Function to handle expanding/collapsing the details
  const toggleExpand = (event: React.MouseEvent) => {
    // Prevent event from bubbling up to parent elements (like card click handlers)
    event.stopPropagation();
    console.log("Toggle expand clicked, current state:", isExpanded);
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Main progress bar section (always visible) */}
      <div 
        className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors group" 
        onClick={toggleExpand}
        role="button"
        aria-expanded={isExpanded}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h3 className="text-sm font-medium">Progress</h3>
            <div className="relative ml-1">
              {isExpanded ? 
                <ChevronDown className="h-4 w-4 text-blue-600" /> : 
                <ChevronRight className="h-4 w-4 text-blue-600" />
              }
            </div>
            <span className="text-xs text-blue-600 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {isExpanded ? "Hide details" : "Show details"}
            </span>
          </div>
          <span className="text-sm font-medium">
            {totalProgress}%
          </span>
        </div>
        
        {/* Main progress bar */}
        <div className="mb-3">
          <ProgressBar 
            value={totalProgress} 
            color={getProjectColor(projectId)}
            showLabel={false}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Expandable detailed progress section */}
      {isExpanded && (
        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
          {systemProgress.map((system) => (
            <div key={system.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {system.icon}
                  <span className="ml-2 text-xs text-slate-700">{system.name}</span>
                </div>
                <span className="text-xs font-medium">{system.value}%</span>
              </div>
              <ProgressBar 
                value={system.value} 
                color={system.color}
                showLabel={false}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}