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

  return (
    <div className={`p-4 rounded-lg border bg-white hover:shadow-md transition-all duration-200 ${className}`}>
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
        
        {/* Main budget bars */}
        <div className="space-y-2 mb-3">
          {/* Materials bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Materials</span>
              <span className="text-sm text-[#084f09]">{formatCurrency(budget.materials)}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${materialColor}`}
                style={{ 
                  width: `${materialWidth}%`
                }}
              ></div>
            </div>
          </div>
          
          {/* Labor bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Labor</span>
              <span className="text-sm text-[#084f09]">{formatCurrency(budget.labor)}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${laborColor}`}
                style={{ 
                  width: `${laborWidth}%`
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
                
                {/* Materials bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Materials</span>
                    <span className="text-xs text-[#084f09]">{formatCurrency(system.materials)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${materialColor}`}
                      style={{ 
                        width: `${sysMaterialWidth}%`
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Labor bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Labor</span>
                    <span className="text-xs text-[#084f09]">{formatCurrency(system.labor)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${laborColor}`}
                      style={{ 
                        width: `${sysLaborWidth}%`
                      }}
                    ></div>
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