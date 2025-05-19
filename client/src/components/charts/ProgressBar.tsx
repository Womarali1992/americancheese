import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: string;
  showLabel?: boolean;
  variant?: string; // Added to support "meter" variant
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
  
  // Get a lighter version of the same color for the background (track color)
  const getLightBgColor = () => {
    switch(color) {
      // Theme-based colors
      case "structural":
        return "var(--tier1-structural-light)";
      case "systems":
        return "var(--tier1-systems-light)";
      case "sheathing":
        return "var(--tier1-sheathing-light)";
      case "finishings":
        return "var(--tier1-finishings-light)";
      
      // Legacy/fallback colors - using lighter shades (bg-color-100 equivalent)
      case "brown":
        return "rgba(254, 215, 170, 1)"; // lighter orange/brown
      case "taupe":
        return "rgba(210, 200, 205, 1)"; // lighter taupe
      case "teal":
        return "rgba(204, 251, 241, 1)"; // lighter teal
      case "slate":
        return "rgba(226, 232, 240, 1)"; // lighter slate
      case "blue":
        return "rgba(219, 234, 254, 1)"; // lighter blue
        
      // Default
      default:
        return "var(--tier1-structural-light)";
    }
  };
  
  // Function to get light background style
  const getLightColorStyle = () => {
    return { backgroundColor: getLightBgColor() };
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600 font-medium">Progress</span>
          <span className="font-semibold">{value}%</span>
        </div>
      )}
      <div className="w-full rounded-full h-2.5" style={getLightColorStyle()}>
        <div
          className="h-2.5 rounded-full transition-all duration-300 shadow-sm"
          style={{ width, ...getColorStyle(), opacity: 1 }}
        ></div>
      </div>
    </div>
  );
}
