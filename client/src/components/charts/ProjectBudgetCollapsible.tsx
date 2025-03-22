import React, { useState } from "react";
import { BudgetChart } from "./BudgetChart";
import { ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BudgetData {
  spent: number;
  remaining: number;
  materials: number;
  labor: number;
}

interface ProjectBudgetCollapsibleProps {
  projectId: number;
  projectName: string;
  budget: BudgetData;
  className?: string;
  expanded?: boolean;
}

export function ProjectBudgetCollapsible({
  projectId,
  projectName,
  budget,
  className = "",
  expanded = false,
}: ProjectBudgetCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const totalBudget = budget.spent + budget.remaining;
  const spentPercentage = Math.round((budget.spent / totalBudget) * 100);

  // Get project-specific color (matching the progress chart)
  const getProjectColor = (id: number): "brown" | "taupe" | "teal" | "slate" | "blue" => {
    const colors: Array<"brown" | "taupe" | "teal" | "slate" | "blue"> = ["brown", "taupe", "teal", "slate", "blue"];
    return colors[(id - 1) % colors.length];
  };

  // Function to handle expanding/collapsing the details
  const toggleExpand = (event: React.MouseEvent) => {
    // Prevent event from bubbling up to parent elements (like card click handlers)
    event.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Budget summary section (always visible) */}
      <div 
        className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors group" 
        onClick={toggleExpand}
        role="button"
        aria-expanded={isExpanded}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h3 className="text-sm font-medium">Budget</h3>
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
            {formatCurrency(budget.spent)} / {formatCurrency(totalBudget)}
          </span>
        </div>

        {/* Budget summary bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
          <div 
            className="h-2 rounded-full" 
            style={{ 
              width: `${spentPercentage}%`,
              backgroundColor: spentPercentage > 90 ? "#f59e0b" : 
                             spentPercentage > 75 ? "#fb923c" : 
                             "#084f09" 
            }}
          ></div>
        </div>
      </div>
      
      {/* Expandable detailed budget section */}
      {isExpanded && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <BudgetChart data={budget} className="pt-2" />
        </div>
      )}
    </div>
  );
}