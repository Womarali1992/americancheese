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
      getCategoryColorValues(category).then(({ baseColor }) => {
        setBadgeColor(baseColor);
      });
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
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-300",
      className
    )}>
      {formatCategoryName(category)}
    </div>
  );
}