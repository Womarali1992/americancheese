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
  // Function to get the CSS variable value for theme-based colors
  const getProgressBarStyle = () => {
    // For theme-based colors, return the appropriate CSS variable
    switch (color) {
      case "structural":
        return { backgroundColor: "var(--tier1-structural)" };
      case "systems":
        return { backgroundColor: "var(--tier1-systems)" };
      case "sheathing":
        return { backgroundColor: "var(--tier1-sheathing)" };
      case "finishings":
        return { backgroundColor: "var(--tier1-finishings)" };
      case "default":
        return { backgroundColor: "var(--tier1-structural)" }; // Default to structural
      default:
        // For hex colors, use them directly
        if (typeof color === 'string' && color.match(/^#[0-9a-fA-F]{6}$/)) {
          return { backgroundColor: color };
        }
        return {}; // Empty object if using class-based colors
    }
  };

  // Function to determine if we should use inline style or class-based styling
  const shouldUseInlineStyle = () => {
    return ["structural", "systems", "sheathing", "finishings", "default"].includes(color as string) || 
           (typeof color === 'string' && color.match(/^#[0-9a-fA-F]{6}$/));
  };

  // Get class-based color (used when not using inline styles)
  const getColor = () => {
    // Only handle class-based colors here
    if (typeof color === 'string') {
      // If it's a specific Tailwind color like "green-600" 
      if (color.match(/^[a-z]+-\d+$/)) {
        return `bg-${color}`; 
      }
      
      // Check if color is one of the predefined options
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
        case "green-600":
          return "bg-green-600";
        case "slate-600":
          return "bg-slate-600";
        case "red-600":
          return "bg-red-600";
        case "amber-600":
          return "bg-amber-600";
        default:
          // If it already starts with bg-, use it directly
          if (color.startsWith('bg-')) {
            return color;
          }
          // Empty string if using inline styles
          return "";
      }
    }
    
    return ""; // Empty string if using inline styles
  };

  const getTrackColor = () => {
    // For theme colors, use a consistent light gray background
    if (["structural", "systems", "sheathing", "finishings", "default"].includes(color as string)) {
      return "bg-gray-100";
    }
    
    // Handle Tailwind class names
    if (typeof color === 'string') {
      // Extract color name from Tailwind class if it matches pattern like "green-600"
      const matches = color.match(/^([a-z]+)-\d+$/);
      if (matches && matches[1]) {
        const colorName = matches[1];
        return `bg-${colorName}-100`; // Use lighter shade for background
      }
      
      // Check specific matches first
      if (color === "green-600" || color.includes("green")) {
        return "bg-green-100";
      }
      if (color === "slate-600" || color.includes("slate")) {
        return "bg-slate-100";
      }
      if (color === "red-600" || color.includes("red")) {
        return "bg-red-100";
      }
      if (color === "amber-600" || color.includes("amber")) {
        return "bg-amber-100";
      }
      
      // Check if color is one of the predefined options
      switch (color) {
        case "brown":
          return "bg-orange-100";
        case "taupe":
          return "bg-[#503e49]/10";
        case "teal":
          return "bg-teal-100";
        case "slate":
          return "bg-slate-200";
        case "blue":
          return "bg-blue-100";
        default:
          return "bg-slate-100"; // Default fallback
      }
    }
    
    // Fallback
    return "bg-slate-100";
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
              shouldUseInlineStyle() ? "" : getColor()
            )}
            style={{ 
              width: `${Math.min(Math.max(value, 0), 100)}%`,
              ...(shouldUseInlineStyle() ? getProgressBarStyle() : {})
            }}
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
          className={cn("h-2.5 rounded-full transition-all duration-300 shadow-sm", 
            shouldUseInlineStyle() ? "" : getColor()
          )}
          style={{ 
            width: `${Math.min(Math.max(value, 0), 100)}%`,
            ...(shouldUseInlineStyle() ? getProgressBarStyle() : {})
          }}
        ></div>
      </div>
    </div>
  );
}
