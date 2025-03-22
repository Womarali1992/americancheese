import React, { useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { Building, Cog, PanelTop, Sofa, ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SystemBudget {
  name: string;
  materials: number;
  labor: number;
  icon: React.ReactNode;
  color: "brown" | "taupe" | "teal" | "slate" | "blue";
}

interface ProjectBudgetChartProps {
  projectId: number;
  projectName: string;
  budget: {
    materials: number;
    labor: number;
    systems?: {
      structural: {
        materials: number;
        labor: number;
      };
      systems: {
        materials: number;
        labor: number;
      };
      sheathing: {
        materials: number;
        labor: number;
      };
      finishings: {
        materials: number;
        labor: number;
      };
    };
  };
  className?: string;
  expanded?: boolean;
}

export function ProjectBudgetChart({
  projectId,
  projectName,
  budget,
  className,
  expanded = false,
}: ProjectBudgetChartProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Total budget for this project
  const totalBudget = budget.materials + budget.labor;
  
  // Check if we have systems breakdown data
  const hasSystemBreakdown = budget.systems !== undefined;
  
  // Create the systems budget breakdown if data is available
  const systemBudget: SystemBudget[] = hasSystemBreakdown ? [
    { 
      name: "Structure", 
      materials: budget.systems!.structural.materials,
      labor: budget.systems!.structural.labor,
      icon: <Building className="h-4 w-4 text-orange-600" />,
      color: "brown"  // Orange/brown for structural
    },
    { 
      name: "Systems", 
      materials: budget.systems!.systems.materials,
      labor: budget.systems!.systems.labor,
      icon: <Cog className="h-4 w-4 text-blue-600" />,
      color: "blue"   // Blue for systems
    },
    { 
      name: "Sheathing", 
      materials: budget.systems!.sheathing.materials,
      labor: budget.systems!.sheathing.labor,
      icon: <PanelTop className="h-4 w-4 text-green-600" />,
      color: "teal"   // Green/teal for sheathing
    },
    { 
      name: "Finishings", 
      materials: budget.systems!.finishings.materials,
      labor: budget.systems!.finishings.labor,
      icon: <Sofa className="h-4 w-4 text-violet-600" />,
      color: "slate"  // Slate/violet for finishings
    },
  ] : [];

  // Calculate max value for scale normalization for the main budget bars
  const maxValue = Math.max(budget.materials, budget.labor);
  
  // Calculate percentage widths based on the max value
  const materialWidth = Math.round((budget.materials / maxValue) * 100);
  const laborWidth = Math.round((budget.labor / maxValue) * 100);
  
  // Get the project color based on ID
  const getProjectColor = (id: number): "brown" | "taupe" | "teal" | "slate" | "blue" => {
    const colors: Array<"brown" | "taupe" | "teal" | "slate" | "blue"> = ["brown", "taupe", "teal", "slate", "blue"];
    return colors[(id - 1) % colors.length];
  };

  // Function to handle expanding/collapsing the details
  const toggleExpand = () => {
    console.log("Toggle expand clicked, current state:", isExpanded);
    setIsExpanded(!isExpanded);
  };
  
  // Material and labor colors
  const materialColor = 'bg-orange-500';
  const laborColor = 'bg-blue-500';

  // Map color names to corresponding border color classes
  const getBorderColorClass = (color: "brown" | "taupe" | "teal" | "slate" | "blue") => {
    const colorMap: Record<string, string> = {
      "brown": "border-[#7E6551]",
      "taupe": "border-[#533747]",
      "slate": "border-[#8896AB]",
      "teal": "border-[#466362]",
      "blue": "border-[#C5D5E4]"
    };
    return colorMap[color];
  };
  
  // Get the border color class based on the project color
  const borderColorClass = getBorderColorClass(getProjectColor(projectId));
  
  return (
    <div className={`p-4 rounded-lg border ${borderColorClass} bg-white hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Main budget section (always visible) */}
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
            {formatCurrency(totalBudget)}
          </span>
        </div>
        
        {/* Combined budget bar */}
        <div className="mb-3">
          {/* Labels */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-orange-500">{formatCurrency(budget.materials)}</span>
              <span className="text-sm font-medium text-blue-500">{formatCurrency(budget.labor)}</span>
              <span className="text-sm font-medium ml-2">Total: {formatCurrency(totalBudget)}</span>
            </div>
          </div>
          
          {/* Single stacked bar */}
          <div className="w-full bg-slate-200 rounded-full h-3">
            {/* Calculate relative percentages of materials and labor against total budget */}
            <div className="flex h-full rounded-full overflow-hidden">
              <div
                className={`h-full ${materialColor}`}
                style={{ 
                  width: `${(budget.materials / totalBudget) * 100}%`
                }}
              ></div>
              <div
                className={`h-full ${laborColor}`}
                style={{ 
                  width: `${(budget.labor / totalBudget) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expandable detailed budget section */}
      {isExpanded && hasSystemBreakdown && (
        <div className="space-y-4 mt-3 border-t pt-3">
          {systemBudget.map((system) => {
            // Calculate max value for scale normalization for system budget bars
            const sysMaxValue = Math.max(system.materials, system.labor);
            // Calculate percentage widths based on the max value
            const sysMaterialWidth = sysMaxValue > 0 ? Math.round((system.materials / sysMaxValue) * 100) : 0;
            const sysLaborWidth = sysMaxValue > 0 ? Math.round((system.labor / sysMaxValue) * 100) : 0;
            
            return (
              <div key={system.name} className="space-y-2">
                <div className="flex items-center mb-1">
                  {system.icon}
                  <span className="ml-2 text-sm font-medium text-slate-700">{system.name}</span>
                </div>
                
                {/* Combined system budget bar */}
                <div>
                  {/* Labels */}
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-medium text-orange-500">{formatCurrency(system.materials)}</span>
                      <span className="text-xs font-medium text-blue-500">{formatCurrency(system.labor)}</span>
                      <span className="text-xs font-medium">Total: {formatCurrency(system.materials + system.labor)}</span>
                    </div>
                  </div>
                  
                  {/* Single stacked bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    {/* Calculate relative percentages of materials and labor against total system budget */}
                    <div className="flex h-full rounded-full overflow-hidden">
                      <div
                        className={`h-full ${materialColor}`}
                        style={{ 
                          width: `${(system.materials / (system.materials + system.labor || 1)) * 100}%`
                        }}
                      ></div>
                      <div
                        className={`h-full ${laborColor}`}
                        style={{ 
                          width: `${(system.labor / (system.materials + system.labor || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}