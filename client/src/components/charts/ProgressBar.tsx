import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: "default" | "brown" | "taupe" | "teal" | "slate" | "blue";
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
      case "brown":
        return "bg-[#7E6551]";
      case "taupe":
        return "bg-[#533747]";
      case "teal":
        return "bg-[#466362]";
      case "slate":
        return "bg-[#8896AB]";
      case "blue":
        return "bg-[#C5D5E4]";
      default:
        return "bg-[#466362]"; // Default to teal
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
