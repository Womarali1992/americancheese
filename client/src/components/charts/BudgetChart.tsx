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

  return (
    <div className={cn("flex items-center justify-center flex-col", className)}>
      <div className="relative inline-block w-36 h-36">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="#e5e7eb" 
            strokeWidth="3" 
            strokeDasharray="100, 100"
          />
          <path 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="#14b8a6" 
            strokeWidth="3" 
            strokeDasharray={`${spentPercentage}, 100`}
          />
          <text 
            x="18" 
            y="20.5" 
            className="text-3xl font-medium" 
            textAnchor="middle" 
            fill="#334155"
          >
            {spentPercentage}%
          </text>
        </svg>
      </div>
      
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-expense mr-2"></div>
          <span className="text-sm">Spent: {formatAmount(data.spent)}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-slate-300 mr-2"></div>
          <span className="text-sm">Remaining: {formatAmount(data.remaining)}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
          <span className="text-sm">Materials: {data.materials}%</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm">Labor: {data.labor}%</span>
        </div>
      </div>
    </div>
  );
}
