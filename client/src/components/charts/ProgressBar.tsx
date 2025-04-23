import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: "default" | "brown" | "taupe" | "teal" | "slate" | "blue";
  showLabel?: boolean;
  variant?: "default" | "meter";
}

export function ProgressBar({
  value,
  className,
  color = "default",
  showLabel = true,
  variant = "default",
}: ProgressBarProps) {
  const getColor = () => {
    switch (color) {
      case "brown":
        return "bg-gradient-to-r from-orange-400 to-orange-500"; // Gradient orange
      case "taupe":
        return "bg-gradient-to-r from-[#5b4352] to-[#533747]"; // Gradient taupe
      case "teal":
        return "bg-gradient-to-r from-[#548886] to-[#466362]"; // Gradient teal
      case "slate":
        return "bg-gradient-to-r from-[#9da7b9] to-[#8896AB]"; // Gradient slate
      case "blue":
        return "bg-gradient-to-r from-[#60a5fa] to-[#3B82F6]"; // Gradient blue
      default:
        return "bg-gradient-to-r from-[#548886] to-[#466362]"; // Default gradient teal
    }
  };

  const getTrackColor = () => {
    switch (color) {
      case "brown":
        return "bg-orange-100";
      case "taupe":
        return "bg-purple-100";
      case "teal":
        return "bg-teal-100";
      case "slate":
        return "bg-slate-200";
      case "blue":
        return "bg-blue-100";
      default:
        return "bg-teal-100";
    }
  };

  if (variant === "meter") {
    return (
      <div className={className}>
        {showLabel && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 font-medium">Progress</span>
            <span className="font-semibold">{value}%</span>
          </div>
        )}
        <div className={cn("w-full rounded-lg h-3", getTrackColor())}>
          <div
            className={cn(
              "h-3 rounded-lg transition-all duration-300 shadow-sm", 
              getColor()
            )}
            style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
          >
            {value > 15 && (
              <div className="h-full flex items-center justify-end pr-1">
                <div className="h-2 w-[1px] bg-white opacity-50 mr-[3px]"></div>
                <div className="h-2 w-[1px] bg-white opacity-50 mr-[3px]"></div>
                <div className="h-2 w-[1px] bg-white opacity-50"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600 font-medium">Progress</span>
          <span className="font-semibold">{value}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full h-2.5", getTrackColor())}>
        <div
          className={cn("h-2.5 rounded-full transition-all duration-300 shadow-sm", getColor())}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        ></div>
      </div>
    </div>
  );
}
