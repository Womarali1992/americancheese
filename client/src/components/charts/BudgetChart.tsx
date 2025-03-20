import React from "react";
import { cn } from "@/lib/utils";

interface BudgetData {
  spent: number;
  remaining: number;
  materials: number;
  labor: number;
}

interface BudgetChartProps {
  data: BudgetData;
  className?: string;
}

export function BudgetChart({ data, className }: BudgetChartProps) {
  // Calculate percentages
  const totalBudget = data.spent + data.remaining;
  const spentPercentage = Math.round((data.spent / totalBudget) * 100);
  
  // Calculate breakdown percentages
  const materialsPercentage = totalBudget > 0 ? Math.round((data.materials / data.spent) * 100) : 0;
  const laborPercentage = totalBudget > 0 ? Math.round((data.labor / data.spent) * 100) : 0;
  const otherPercentage = 100 - materialsPercentage - laborPercentage;
  
  // Format amounts to USD
  const formatAmount = (amount: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    });
    
    return formatter.format(amount);
  };

  // Get color for circle based on percentage spent
  const getCircleColor = (percentage: number) => {
    if (percentage > 90) return "#f59e0b"; // amber-500 - warning
    if (percentage > 75) return "#fb923c"; // orange-400 - caution
    return "#14b8a6"; // teal-500 - good
  };

  return (
    <div className={cn("flex items-center justify-center flex-col", className)}>
      <div className="relative inline-block w-36 h-36">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          {/* Background circle */}
          <path 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="#e5e7eb" 
            strokeWidth="3.6" 
            strokeDasharray="100, 100"
          />
          {/* Progress circle */}
          <path 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke={getCircleColor(spentPercentage)} 
            strokeWidth="3.6" 
            strokeDasharray={`${spentPercentage}, 100`}
            strokeLinecap="round"
          />
          {/* Percentage text */}
          <text 
            x="18" 
            y="17.5" 
            className="text-2xl font-medium" 
            textAnchor="middle" 
            fill="#334155"
          >
            {spentPercentage}%
          </text>
          <text 
            x="18" 
            y="22.5" 
            className="text-xs" 
            textAnchor="middle" 
            fill="#64748b"
          >
            Spent
          </text>
        </svg>
      </div>
      
      {/* Budget breakdown bars */}
      <div className="w-full mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>Labor</span>
          </div>
          <span>{formatAmount(data.labor)}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full" 
            style={{ width: `${laborPercentage}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span>Materials</span>
          </div>
          <span>{formatAmount(data.materials)}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className="bg-amber-500 h-2 rounded-full" 
            style={{ width: `${materialsPercentage}%` }}
          ></div>
        </div>
        
        {otherPercentage > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-slate-400 mr-2"></div>
                <span>Other</span>
              </div>
              <span>{formatAmount(data.spent - data.materials - data.labor)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-slate-400 h-2 rounded-full" 
                style={{ width: `${otherPercentage}%` }}
              ></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
