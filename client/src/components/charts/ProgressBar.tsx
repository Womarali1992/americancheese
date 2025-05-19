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
    if (color === "structural" || color === "purple-800") {
      return { backgroundColor: "var(--tier1-structural)" };
    }
    if (color === "systems" || color === "red-900") {
      return { backgroundColor: "var(--tier1-systems)" };
    }
    if (color === "sheathing" || color === "slate-700") {
      return { backgroundColor: "var(--tier1-sheathing)" };
    }
    if (color === "finishings" || color === "purple-500") {
      return { backgroundColor: "var(--tier1-finishings)" };
    }
    
    // Handle direct Tailwind color classes
    if (color.includes('-')) {
      // Convert Tailwind color format (like "purple-800") to CSS color
      const [colorName, intensityStr] = color.split('-');
      const intensity = parseInt(intensityStr || "500", 10);
      
      // Map Tailwind color names to hex values
      const colorMap: Record<string, Record<number, string>> = {
        purple: {
          100: "#f3e8ff", 500: "#a855f7", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87"
        },
        red: {
          100: "#fee2e2", 500: "#ef4444", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d"
        },
        slate: {
          100: "#f1f5f9", 500: "#64748b", 700: "#334155", 800: "#1e293b", 900: "#0f172a"
        },
        blue: {
          100: "#dbeafe", 500: "#3b82f6", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a"
        },
        green: {
          100: "#dcfce7", 500: "#22c55e", 700: "#15803d", 800: "#166534", 900: "#14532d"
        },
        emerald: {
          100: "#d1fae5", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46"
        },
        amber: {
          100: "#fef3c7", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e"
        },
        yellow: {
          100: "#fef9c3", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e"
        },
        orange: {
          100: "#ffedd5", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412"
        },
        gray: {
          100: "#f3f4f6", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937"
        }
      };

      // Check if we have this color and intensity in our map
      if (colorMap[colorName] && colorMap[colorName][intensity]) {
        return { backgroundColor: colorMap[colorName][intensity] };
      }
      
      // Fallbacks for specific colors based on intensity ranges
      if (colorMap[colorName]) {
        if (intensity >= 700) {
          return { backgroundColor: colorMap[colorName][700] || colorMap[colorName][500] };
        } else {
          return { backgroundColor: colorMap[colorName][500] };
        }
      }
      
      // Final fallback
      return { backgroundColor: "#64748b" }; // Default slate
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
    // Theme-based colors
    if (color === "structural" || color === "purple-800") {
      return "var(--tier1-structural-light)";
    }
    if (color === "systems" || color === "red-900") {
      return "var(--tier1-systems-light)";
    }
    if (color === "sheathing" || color === "slate-700") {
      return "var(--tier1-sheathing-light)";
    }
    if (color === "finishings" || color === "purple-500") {
      return "var(--tier1-finishings-light)";
    }
    
    // Handle direct Tailwind color classes
    if (color.includes('-')) {
      // Convert Tailwind color format (like "purple-800") to CSS color
      const [colorName, intensity] = color.split('-');
      
      // Map of color names to their light (100) variants
      const lightColorMap: Record<string, string> = {
        purple: "#f3e8ff",  // purple-100
        red: "#fee2e2",     // red-100
        slate: "#f1f5f9",   // slate-100
        blue: "#dbeafe",    // blue-100
        green: "#dcfce7",   // green-100
        emerald: "#d1fae5", // emerald-100
        amber: "#fef3c7",   // amber-100
        yellow: "#fef9c3",  // yellow-100
        orange: "#ffedd5",  // orange-100
        gray: "#f3f4f6",    // gray-100
        lime: "#ecfccb",    // lime-100
        cyan: "#cffafe",    // cyan-100
        indigo: "#e0e7ff",  // indigo-100
        violet: "#ede9fe",  // violet-100
        rose: "#ffe4e6",    // rose-100
        pink: "#fce7f3",    // pink-100
        fuchsia: "#fae8ff", // fuchsia-100
        sky: "#e0f2fe"      // sky-100
      };
      
      return lightColorMap[colorName] || "#f1f5f9"; // fallback to slate-100
    }
    
    // Legacy/fallback colors - using lighter shades (bg-color-100 equivalent)
    if (color === "brown") {
      return "rgba(254, 215, 170, 1)"; // lighter orange/brown
    }
    if (color === "taupe") {
      return "rgba(210, 200, 205, 1)"; // lighter taupe
    }
    if (color === "teal") {
      return "rgba(204, 251, 241, 1)"; // lighter teal
    }
    if (color === "slate") {
      return "rgba(226, 232, 240, 1)"; // lighter slate
    }
    if (color === "blue") {
      return "rgba(219, 234, 254, 1)"; // lighter blue
    }
    
    // Default
    return "var(--tier1-structural-light)";
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
