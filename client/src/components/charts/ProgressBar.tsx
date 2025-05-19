import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: string;
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
  // Calculate width as percentage (clamped between 0-100%)
  const width = `${Math.min(Math.max(value, 0), 100)}%`;
  
  // Get color styles based on the color prop
  const getColorStyle = () => {
    // Direct CSS variable mapping for theme colors
    if (color === "structural") {
      return { backgroundColor: "var(--tier1-structural)" };
    }
    if (color === "systems") {
      return { backgroundColor: "var(--tier1-systems)" };
    }
    if (color === "sheathing") {
      return { backgroundColor: "var(--tier1-sheathing)" };
    }
    if (color === "finishings") {
      return { backgroundColor: "var(--tier1-finishings)" };
    }
    
    // Legacy/fallback colors
    if (color === "brown") {
      return { backgroundColor: "#f97316" };
    }
    if (color === "taupe") {
      return { backgroundColor: "#5b4352" };
    }
    if (color === "teal") {
      return { backgroundColor: "#0d9488" };
    }
    if (color === "slate") {
      return { backgroundColor: "#64748b" };
    }
    if (color === "blue") {
      return { backgroundColor: "#3b82f6" };
    }
    
    // Default color (use structural theme color)
    return { backgroundColor: "var(--tier1-structural)" };
  };
  
  // Get the tick mark color based on the progress bar color
  const getTickColor = () => {
    // We'll use a translucent version of the background color
    // by using the same variable but with different opacity
    if (color === "structural") {
      return { backgroundColor: "rgba(255, 255, 255, 0.7)" };
    }
    if (color === "systems") {
      return { backgroundColor: "rgba(255, 255, 255, 0.7)" };
    }
    if (color === "sheathing") {
      return { backgroundColor: "rgba(255, 255, 255, 0.7)" };
    }
    if (color === "finishings") {
      return { backgroundColor: "rgba(255, 255, 255, 0.7)" };
    }
    
    // For other colors, use white with opacity
    return { backgroundColor: "rgba(255, 255, 255, 0.7)" };
  };
  
  // For the meter variant (with tick marks)
  if (variant === "meter") {
    return (
      <div className={className}>
        {showLabel && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 font-medium">Progress</span>
            <span className="font-semibold">{value}%</span>
          </div>
        )}
        <div className="w-full rounded-lg h-3 bg-gray-100 relative overflow-hidden">
          <div
            className="h-3 rounded-lg transition-all duration-300 shadow-sm"
            style={{ width, ...getColorStyle() }}
          >
            {value > 15 && (
              <div className="h-full flex items-center justify-end">
                <div className="absolute right-3 top-0 h-full flex items-center">
                  <div className="h-2 w-[1px] mr-[3px]" style={getTickColor()}></div>
                  <div className="h-2 w-[1px] mr-[3px]" style={getTickColor()}></div>
                  <div className="h-2 w-[1px]" style={getTickColor()}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For the default variant (without tick marks)
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600 font-medium">Progress</span>
          <span className="font-semibold">{value}%</span>
        </div>
      )}
      <div className="w-full rounded-full h-2.5 bg-gray-100">
        <div
          className="h-2.5 rounded-full transition-all duration-300 shadow-sm"
          style={{ width, ...getColorStyle() }}
        ></div>
      </div>
    </div>
  );
}
