import React, { useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { Building, Cog, PanelTop, Sofa, ChevronDown, ChevronRight } from "lucide-react";

interface SystemProgress {
  name: string;
  value: number;
  icon: React.ReactNode;
  color: "brown" | "taupe" | "teal" | "slate" | "blue";
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

  const systemProgress: SystemProgress[] = [
    { 
      name: "Structure", 
      value: progress.structural, 
      icon: <Building className="h-4 w-4 text-orange-600" />,
      color: "brown"  // Orange/brown for structural
    },
    { 
      name: "Systems", 
      value: progress.systems, 
      icon: <Cog className="h-4 w-4 text-blue-600" />,
      color: "blue"   // Blue for systems
    },
    { 
      name: "Sheathing", 
      value: progress.sheathing, 
      icon: <PanelTop className="h-4 w-4 text-green-600" />,
      color: "teal"   // Green/teal for sheathing
    },
    { 
      name: "Finishings", 
      value: progress.finishings, 
      icon: <Sofa className="h-4 w-4 text-violet-600" />,
      color: "slate"  // Slate/violet for finishings
    },
  ];

  // Calculate total project progress (average of all systems)
  const totalProgress = Math.round(
    (progress.structural + progress.systems + progress.sheathing + progress.finishings) / 4
  );

  // Get the project color based on ID
  const getProjectColor = (id: number): "default" | "brown" | "taupe" | "teal" | "slate" | "blue" => {
    const colors: Array<"brown" | "taupe" | "teal" | "slate" | "blue"> = ["brown", "taupe", "teal", "slate", "blue"];
    return colors[(id - 1) % colors.length];
  };

  // Function to handle expanding/collapsing the details
  const toggleExpand = () => {
    console.log("Toggle expand clicked, current state:", isExpanded);
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`p-4 rounded-lg border bg-white hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Main progress bar section (always visible) */}
      <div className="cursor-pointer hover:bg-slate-50 rounded-md transition-colors" onClick={toggleExpand}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h3 className="text-md font-medium">{projectName}</h3>
            {isExpanded ? 
              <ChevronDown className="ml-1 h-4 w-4 text-blue-600" /> : 
              <ChevronRight className="ml-1 h-4 w-4 text-blue-600" />
            }
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
        <div className="space-y-3 mt-3 border-t pt-3">
          {systemProgress.map((system) => (
            <div key={system.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {system.icon}
                  <span className="ml-2 text-xs md:text-sm text-slate-700">{system.name}</span>
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