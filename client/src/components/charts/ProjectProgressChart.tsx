import React from "react";
import { ProgressBar } from "./ProgressBar";
import { Building, Cog, PanelTop, Sofa } from "lucide-react";

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
}

export function ProjectProgressChart({
  projectId,
  projectName,
  progress,
  className,
}: ProjectProgressChartProps) {
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

  return (
    <div className={`p-4 rounded-lg border bg-white ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-medium">{projectName}</h3>
        <span className="text-sm font-medium bg-slate-100 rounded-full px-2 py-1">
          {totalProgress}% Complete
        </span>
      </div>
      
      <div className="space-y-4">
        {systemProgress.map((system) => (
          <div key={system.name} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {system.icon}
                <span className="ml-2 text-sm text-slate-700">{system.name}</span>
              </div>
              <span className="text-xs font-medium text-slate-600">{system.value}%</span>
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
    </div>
  );
}