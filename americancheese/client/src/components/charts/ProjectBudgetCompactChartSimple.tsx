import React, { useState } from "react";
import { ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProjectBudgetCompactChartSimpleProps {
  budget: number;
  materialCost: number;
  laborCost: number;
  className?: string;
}

export function ProjectBudgetCompactChartSimple({
  budget,
  materialCost,
  laborCost,
  className = "",
}: ProjectBudgetCompactChartSimpleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Total expenses
  const totalExpenses = materialCost + laborCost;
  
  // Material and labor colors
  const materialColor = 'bg-orange-500';
  const laborColor = 'bg-blue-500';

  // Function to handle expanding/collapsing the details
  const toggleExpand = (event: React.MouseEvent) => {
    // Prevent event from bubbling up to parent elements (like card click handlers)
    event.stopPropagation();
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
                  width: totalExpenses > 0 ? `${(materialCost / totalExpenses) * 100}%` : '0%',
                  minWidth: materialCost > 0 ? '60px' : '0'
                }}
              >
                {materialCost > 0 && (
                  <span className="text-xs text-white font-medium px-1">
                    {formatCurrency(materialCost)}
                  </span>
                )}
              </div>
              <div
                className={`h-full ${laborColor} flex items-center justify-center`}
                style={{ 
                  width: totalExpenses > 0 ? `${(laborCost / totalExpenses) * 100}%` : '0%',
                  minWidth: laborCost > 0 ? '60px' : '0'
                }}
              >
                {laborCost > 0 && (
                  <span className="text-xs text-white font-medium px-1">
                    {formatCurrency(laborCost)}
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
      
      {/* Expandable budget info section */}
      {isExpanded && (
        <div className="space-y-3 mt-2 pt-2 border-t border-slate-100">
          <div className="text-center text-sm">
            <span className="font-medium">Total Budget: </span>
            <span>{formatCurrency(budget)}</span>
          </div>
          <div className="text-center text-sm">
            <span className="font-medium">Budget Remaining: </span>
            <span className={budget - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}>
              {formatCurrency(budget - totalExpenses)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}