import React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";

interface BudgetData {
  spent: number;
  remaining: number;
  materials: number;
  labor: number;
}

interface BudgetBarChartProps {
  data: BudgetData;
  className?: string;
}

export function BudgetBarChart({ data, className }: BudgetBarChartProps) {
  // Create data for the bar chart
  const chartData = [
    { name: "Materials", value: data.materials, color: "#fb923c" }, // orange-400
    { name: "Labor", value: data.labor, color: "#3b82f6" }, // blue-500
    { name: "Other", value: data.spent - data.materials - data.labor, color: "#64748b" }, // slate-500
  ].filter(item => item.value > 0);
  
  // Format amounts to USD
  const formatAmount = (value: number) => {
    return formatCurrency(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-slate-200 shadow-sm rounded-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatAmount(payload[0].value)}</p>
          <p className="text-xs text-slate-500">
            {Math.round((payload[0].value / data.spent) * 100)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("w-full h-full", className)}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm">Total Budget: {formatAmount(data.spent + data.remaining)}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-slate-300 mr-2"></div>
          <span className="text-sm">Remaining: {formatAmount(data.remaining)}</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" tickFormatter={formatAmount} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" barSize={30} radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList 
              dataKey="value" 
              position="right" 
              formatter={formatAmount} 
              style={{ fontSize: '11px', fill: '#64748b' }} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}