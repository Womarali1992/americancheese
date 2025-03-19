import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: "default" | "amber" | "green";
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  className,
  color = "default",
  showLabel = true,
}: ProgressBarProps) {
  const getColor = () => {
    switch (color) {
      case "amber":
        return "bg-amber-500";
      case "green":
        return "bg-green-500";
      default:
        return "bg-project";
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600">Progress</span>
          <span className="font-medium">{value}%</span>
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div
          className={cn("h-2.5 rounded-full", getColor())}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}
