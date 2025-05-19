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
  
  // Helper to get a hex color from any color format (CSS variable, tailwind class, or hex)
  const getHexColor = (colorValue: string): string => {
    // Handle CSS variables
    if (colorValue === "structural") {
      return getComputedStyle(document.documentElement).getPropertyValue('--tier1-structural').trim() || "#fbbf24";
    }
    if (colorValue === "systems") {
      return getComputedStyle(document.documentElement).getPropertyValue('--tier1-systems').trim() || "#1e3a8a";
    }
    if (colorValue === "sheathing") {
      return getComputedStyle(document.documentElement).getPropertyValue('--tier1-sheathing').trim() || "#ef4444";
    }
    if (colorValue === "finishings") {
      return getComputedStyle(document.documentElement).getPropertyValue('--tier1-finishings').trim() || "#0f172a";
    }
    
    // Handle Tailwind-style classes (like purple-800)
    if (colorValue.includes('-')) {
      const [colorName, intensityStr] = colorValue.split('-');
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
        return colorMap[colorName][intensity];
      }
      
      // Fallbacks for specific colors
      if (colorMap[colorName]) {
        return colorMap[colorName][500] || "#64748b";
      }
    }
    
    // Handle standard colors
    if (colorValue === "brown") return "#f97316";
    if (colorValue === "taupe") return "#5b4352";
    if (colorValue === "teal") return "#0d9488";
    if (colorValue === "slate") return "#64748b";
    if (colorValue === "blue") return "#3b82f6";
    
    // If it's already a hex color, return as is
    if (colorValue.startsWith('#')) {
      return colorValue;
    }
    
    // Default color
    return "#6366f1"; // indigo-500
  };

  // Function to lighten any hex color
  const lightenColor = (hexColor: string, amount: number = 0.85): string => {
    // Remove the # if it exists
    hexColor = hexColor.replace('#', '');
    
    // Parse the hex color
    let r = parseInt(hexColor.substring(0, 2), 16);
    let g = parseInt(hexColor.substring(2, 4), 16);
    let b = parseInt(hexColor.substring(4, 6), 16);
    
    // Lighten the color
    r = Math.min(255, Math.round(r + (255 - r) * amount));
    g = Math.min(255, Math.round(g + (255 - g) * amount));
    b = Math.min(255, Math.round(b + (255 - b) * amount));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Get the main color for the filled portion of the progress bar
  const getColorStyle = () => {
    const hexColor = getHexColor(color);
    return { backgroundColor: hexColor };
  };
  
  // Get a lighter version of the same color for the background (track color)
  const getLightBgColor = () => {
    const hexColor = getHexColor(color);
    // Lighten the color to get a lighter shade for the track
    return lightenColor(hexColor, 0.85);
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
