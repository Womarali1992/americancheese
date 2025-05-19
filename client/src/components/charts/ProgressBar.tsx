import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: string | "default" | "brown" | "taupe" | "teal" | "slate" | "blue" | "structural" | "systems" | "sheathing" | "finishings";
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
  // Get the style for the progress bar based on color
  const getProgressStyle = () => {
    const baseStyle = { width: `${Math.min(Math.max(value, 0), 100)}%` };
    
    if (color === "structural") {
      return { ...baseStyle, backgroundColor: "var(--tier1-structural)" };
    } 
    if (color === "systems") {
      return { ...baseStyle, backgroundColor: "var(--tier1-systems)" };
    } 
    if (color === "sheathing") {
      return { ...baseStyle, backgroundColor: "var(--tier1-sheathing)" };
    } 
    if (color === "finishings") {
      return { ...baseStyle, backgroundColor: "var(--tier1-finishings)" };
    }
    if (color === "default") {
      return { ...baseStyle, backgroundColor: "var(--tier1-structural)" };
    }
    
    // Legacy color support
    switch (color) {
      case "brown":
        return { ...baseStyle, background: "linear-gradient(to right, #f97316, #ef4444)" };
      case "taupe":
        return { ...baseStyle, background: "linear-gradient(to right, #5b4352, #533747)" };
      case "teal":
        return { ...baseStyle, background: "linear-gradient(to right, #548886, #466362)" };
      case "slate":
        return { ...baseStyle, background: "linear-gradient(to right, #9da7b9, #8896AB)" };
      case "blue":
        return { ...baseStyle, background: "linear-gradient(to right, #60a5fa, #3B82F6)" };
      default:
        if (typeof color === 'string') {
          // Handle hex colors
          if (color.match(/^#[0-9a-fA-F]{6}$/)) {
            return { ...baseStyle, backgroundColor: color };
          }
          // Handle tailwind colors
          if (color.match(/^[a-z]+-\d+$/)) {
            return baseStyle; // We'll use class for these
          }
        }
        return { ...baseStyle, backgroundColor: "#3B82F6" }; // Fallback blue
    }
  };
  
  // Get additional classes for tailwind colors
  const getColorClass = () => {
    if (typeof color === 'string' && color.match(/^[a-z]+-\d+$/)) {
      return `bg-${color}`;
    }
    return "";
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
        <div className="w-full rounded-lg h-3 bg-gray-100">
          <div
            className={cn("h-3 rounded-lg transition-all duration-300 shadow-sm", getColorClass())}
            style={getProgressStyle()}
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
      <div className="w-full rounded-full h-2.5 bg-gray-100">
        <div
          className={cn("h-2.5 rounded-full transition-all duration-300 shadow-sm", getColorClass())}
          style={getProgressStyle()}
        ></div>
      </div>
    </div>
  );
}
