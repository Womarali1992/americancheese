import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: string;
  showLabel?: boolean;
  variant?: string; // Added to support "meter" variant
  onClick?: () => void; // Add click handler for navigation
  navigable?: boolean; // Whether the progress bar should be clickable
}

export function ProgressBar({
  value,
  className,
  color = "default",
  showLabel = true,
  variant = "default",
  onClick,
  navigable = false,
}: ProgressBarProps) {
  // Calculate width as percentage (clamped between 0-100%)
  const width = `${Math.min(Math.max(value, 0), 100)}%`;
  
  // Helper to get a hex color from any color format (CSS variable, tailwind class, or hex)
  const getHexColor = (colorValue: string): string => {
    // If colorValue is null, undefined, or not a string, use default
    if (!colorValue || typeof colorValue !== 'string') {
      return "#6366f1"; // indigo-500 default
    }
    
    const lowerColorValue = colorValue.toLowerCase().trim();
    
    // Handle CSS variables for tier1 categories
    if (lowerColorValue === "structural") {
      // Read directly from CSS variables with fallbacks
      const structural = getComputedStyle(document.documentElement)
        .getPropertyValue('--tier1-structural')
        .trim();
      
      // Ensure we have a proper color value (must start with #)
      if (structural && structural.startsWith('#')) {
        return structural;
      }
      return "#fbbf24"; // Default amber if not available
    }
    if (lowerColorValue === "systems") {
      const systems = getComputedStyle(document.documentElement)
        .getPropertyValue('--tier1-systems')
        .trim();
      
      if (systems && systems.startsWith('#')) {
        return systems;
      }
      return "#1e3a8a"; // Default blue if not available
    }
    if (lowerColorValue === "sheathing") {
      const sheathing = getComputedStyle(document.documentElement)
        .getPropertyValue('--tier1-sheathing')
        .trim();
      
      if (sheathing && sheathing.startsWith('#')) {
        return sheathing;
      }
      return "#ef4444"; // Default red if not available
    }
    if (lowerColorValue === "finishings") {
      const finishings = getComputedStyle(document.documentElement)
        .getPropertyValue('--tier1-finishings')
        .trim();
      
      if (finishings && finishings.startsWith('#')) {
        return finishings;
      }
      return "#0f172a"; // Default dark if not available
    }
    
    // Handle project-specific tier1 categories
    if (lowerColorValue.includes('ali') || lowerColorValue.includes('apartment')) {
      return "#3b82f6"; // Blue for ALI/Apartment categories
    }
    
    if (lowerColorValue.includes('ux') || lowerColorValue.includes('ui') || lowerColorValue.includes('design')) {
      return "#8b5cf6"; // Purple for UX/UI/Design categories
    }
    
    if (lowerColorValue.includes('search') || lowerColorValue.includes('agent') || lowerColorValue.includes('workflow')) {
      return "#10b981"; // Green for Search/Agent/Workflow categories
    }
    
    if (lowerColorValue.includes('website') || lowerColorValue.includes('admin') || lowerColorValue.includes('web')) {
      return "#f59e0b"; // Orange for Website/Admin/Web categories
    }
    // Check for specific project category patterns and map to appropriate colors
    if (lowerColorValue.includes('search') || lowerColorValue.includes('workflow') || lowerColorValue.includes('agent work')) {
      return "#10b981"; // Use green color to match modules tier2 category
    }
    if (lowerColorValue.includes('apartment') && lowerColorValue.includes('locating')) {
      return "#556b2f"; // Use moss green for A.L.I. development
    }
    if (lowerColorValue.includes('website') || lowerColorValue.includes('admin') || lowerColorValue.includes('development')) {
      return "#1e3a8a"; // Use systems/blue color for web development
    }
    
    // Handle tier2 categories - match the color mapping from getTier2CategoryColor
    
    // Structural subcategories
    if (lowerColorValue === 'foundation') return '#047857'; // emerald-700
    if (lowerColorValue === 'framing') return '#65a30d'; // lime-600
    if (lowerColorValue === 'roofing') return '#15803d'; // green-700
    if (lowerColorValue === 'lumber') return '#047857'; // emerald-700
    if (lowerColorValue === 'shingles') return '#166534'; // green-800
    
    // Systems subcategories
    if (lowerColorValue === 'electrical' || lowerColorValue === 'electric') return '#2563eb'; // blue-600
    if (lowerColorValue === 'plumbing') return '#0891b2'; // cyan-600
    if (lowerColorValue === 'hvac') return '#0284c7'; // sky-600
    
    // Sheathing subcategories
    if (lowerColorValue === 'barriers') return '#e11d48'; // rose-600
    if (lowerColorValue === 'drywall') return '#db2777'; // pink-600
    if (lowerColorValue === 'exteriors') return '#ef4444'; // red-500
    if (lowerColorValue === 'siding') return '#f43f5e'; // rose-500
    if (lowerColorValue === 'insulation') return '#b91c1c'; // red-700
    
    // Finishings subcategories
    if (lowerColorValue === 'windows') return '#f59e0b'; // amber-500
    if (lowerColorValue === 'doors') return '#ca8a04'; // yellow-600
    if (lowerColorValue === 'cabinets') return '#ea580c'; // orange-600
    if (lowerColorValue === 'fixtures') return '#b45309'; // amber-700
    if (lowerColorValue === 'flooring') return '#a16207'; // yellow-700
    if (lowerColorValue === 'paint') return '#f97316'; // orange-500
    if (lowerColorValue === 'permits') return '#d97706'; // amber-600
    
    // Other tier2 categories
    if (lowerColorValue === 'landscaping') return '#059669'; // emerald-600
    if (lowerColorValue === 'cleanup') return '#6b7280'; // gray-500
    if (lowerColorValue === 'inspection') return '#7c3aed'; // violet-600
    if (lowerColorValue === 'website') return '#3b82f6'; // blue-500
    if (lowerColorValue === 'modules') return '#8b5cf6'; // violet-500
    if (lowerColorValue === 'system design') return '#06b6d4'; // cyan-500
    if (lowerColorValue === 'prompting') return '#10b981'; // emerald-500
    if (lowerColorValue === 'tools') return '#f59e0b'; // amber-500
    
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
      <div 
        className={`w-full rounded-full h-2.5 ${navigable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`} 
        style={getLightColorStyle()}
        onClick={navigable ? onClick : undefined}
      >
        <div
          className="h-2.5 rounded-full transition-all duration-300 shadow-sm"
          style={{ width, ...getColorStyle(), opacity: 1 }}
        ></div>
      </div>
    </div>
  );
}
