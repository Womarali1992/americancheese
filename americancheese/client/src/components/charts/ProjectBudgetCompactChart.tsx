import React, { useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { Building, Cog, PanelTop, Sofa, ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getChartColors } from "@/lib/unified-color-system";

interface ProjectBudgetCompactChartProps {
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

export function ProjectBudgetCompactChart({
  projectId,
  projectName,
  budget,
  className = "",
  expanded = false,
}: ProjectBudgetCompactChartProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Total expenses for this project
  const totalExpenses = budget.materials + budget.labor;
  
  // Check if we have systems breakdown data
  const hasSystemBreakdown = budget.systems !== undefined;
  
  // Create the systems budget breakdown if data is available
  const systemBudget = hasSystemBreakdown ? [
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

  // Material and labor colors from theme
  const { materialColor, laborColor } = getChartColors();

  // Function to handle expanding/collapsing the details
  const toggleExpand = (event: React.MouseEvent) => {
    // Prevent event from bubbling up to parent elements (like card click handlers)
    event.stopPropagation();
    console.log("Toggle expand clicked, current state:", isExpanded);
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={`${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Main budget section (always visible) */}
      <div 
        className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors group" 
        onClick={toggleExpand}
        role="button"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-center mb-2">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-slate-600" />
            <h3 className="text-sm font-medium">Expenses: {formatCurrency(totalExpenses)}</h3>
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
        </div>
        
        {/* Combined expenses bar */}
        <div className="mb-1">
          {/* Single stacked bar */}
          <div className="w-full bg-slate-200 rounded-full h-7 relative">
            {/* Calculate relative percentages of materials and labor against total expenses */}
            <div className="flex h-full rounded-full overflow-hidden">
              <div
                className={`h-full ${materialColor} flex items-center justify-center`}
                style={{ 
                  width: `${(budget.materials / totalExpenses) * 100}%`,
                  minWidth: budget.materials > 0 ? '60px' : '0'
                }}
              >
                {budget.materials > 0 && (
                  <span className="text-xs text-white font-medium px-1">
                    {formatCurrency(budget.materials)}
                  </span>
                )}
              </div>
              <div
                className={`h-full ${laborColor} flex items-center justify-center`}
                style={{ 
                  width: `${(budget.labor / totalExpenses) * 100}%`,
                  minWidth: budget.labor > 0 ? '60px' : '0'
                }}
              >
                {budget.labor > 0 && (
                  <span className="text-xs text-white font-medium px-1">
                    {formatCurrency(budget.labor)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-between text-xs">
          <div className="flex items-center text-blue-500">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
            <span>Labor</span>
          </div>
          <div className="flex items-center text-orange-500">
            <div className="w-2 h-2 rounded-full bg-orange-500 mr-1"></div>
            <span>Materials</span>
          </div>
        </div>
      </div>
      
      {/* Expandable detailed expenses section */}
      {isExpanded && hasSystemBreakdown && (
        <div className="space-y-3 mt-2 pt-2 border-t border-slate-100">
          {systemBudget.map((system) => (
            <div key={system.name} className="space-y-1">
              <div className="flex items-center justify-center">
                {system.icon}
                <span className="ml-2 text-xs font-medium text-slate-700">
                  {system.name}: {formatCurrency(system.materials + system.labor)}
                </span>
              </div>
              
              {/* System expenses bar */}
              <div className="w-full bg-slate-200 rounded-full h-6 relative">
                <div className="flex h-full rounded-full overflow-hidden">
                  <div
                    className={`h-full ${materialColor} flex items-center justify-center`}
                    style={{ 
                      width: `${(system.materials / (system.materials + system.labor || 1)) * 100}%`,
                      minWidth: system.materials > 0 ? '60px' : '0'
                    }}
                  >
                    {system.materials > 0 && (
                      <span className="text-xs text-white font-medium px-1">
                        {formatCurrency(system.materials)}
                      </span>
                    )}
                  </div>
                  <div
                    className={`h-full ${laborColor} flex items-center justify-center`}
                    style={{ 
                      width: `${(system.labor / (system.materials + system.labor || 1)) * 100}%`,
                      minWidth: system.labor > 0 ? '60px' : '0'
                    }}
                  >
                    {system.labor > 0 && (
                      <span className="text-xs text-white font-medium px-1">
                        {formatCurrency(system.labor)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}