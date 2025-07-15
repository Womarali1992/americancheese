import { cn } from "@/lib/utils";
import { 
  getCategoryColor, 
  formatCategoryName, 
  getTier1CategoryColor, 
  getTier2CategoryColor,
  getCategoryColorValues 
} from "@/lib/color-utils";
import { getThemeTier1Color, getThemeTier2Color } from "@/lib/color-themes";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

// Function to determine if we should use light or dark text based on background color
function getContrastColor(hexColor: string | null | undefined): string {
  // Handle undefined, null, or empty values
  if (!hexColor) {
    return '#ffffff'; // Default to white text
  }
  
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Validate hex color format
  if (color.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(color)) {
    return '#ffffff'; // Default to white text for invalid colors
  }
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white text for dark backgrounds, black text for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

interface CategoryBadgeProps {
  category: string;
  className?: string;
  variant?: "solid" | "outline";
  type?: "category" | "tier1" | "tier2";
  color?: string | null;
}

export function CategoryBadge({ 
  category, 
  className,
  variant = "solid",
  type = "category",
  color = null
}: CategoryBadgeProps) {
  // Use our ThemeProvider
  const { currentTheme } = useTheme();
  const [badgeColor, setBadgeColor] = useState<string>('#333333');
  
  // Set the badge color based on the category type and current theme
  useEffect(() => {
    if (color) {
      // Custom color provided directly to component
      setBadgeColor(color);
    } else if (type === "tier1") {
      // Get color from the current theme for tier1 categories
      const lowerCategory = category.toLowerCase();
      if (lowerCategory === 'structural' && currentTheme.tier1.structural) {
        setBadgeColor(currentTheme.tier1.structural);
      } else if (lowerCategory === 'systems' && currentTheme.tier1.systems) {
        setBadgeColor(currentTheme.tier1.systems);
      } else if (lowerCategory === 'sheathing' && currentTheme.tier1.sheathing) {
        setBadgeColor(currentTheme.tier1.sheathing);
      } else if (lowerCategory === 'finishings' && currentTheme.tier1.finishings) {
        setBadgeColor(currentTheme.tier1.finishings);
      } else {
        setBadgeColor(currentTheme.tier1.default || '#333333');
      }
    } else if (type === "tier2") {
      // Get color from the current theme for tier2 categories
      const lowerCategory = category.toLowerCase();
      if (lowerCategory in currentTheme.tier2) {
        setBadgeColor(currentTheme.tier2[lowerCategory as keyof typeof currentTheme.tier2]);
      } else {
        setBadgeColor(currentTheme.tier2.other || '#555555');
      }
    } else {
      // For regular categories, use the existing category colors
      const { baseColor } = getCategoryColorValues(category);
      setBadgeColor(baseColor);
    }
  }, [category, color, type, currentTheme]);
  
  // Render based on the final computed color
  if (variant === "outline") {
    return (
      <div className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        "bg-white",
        className
      )} style={{ 
        borderColor: badgeColor,
        color: badgeColor
      }}>
        {formatCategoryName(category)}
      </div>
    );
  }
  
  return (
    <div className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      className
    )} style={{ 
      backgroundColor: badgeColor,
      borderColor: badgeColor,
      color: getContrastColor(badgeColor)
    }}>
      {formatCategoryName(category)}
    </div>
  );
}