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
        // For custom tier1 categories, use a default color or generate one based on category name
        const customColors = {
          'ux/ui': '#8b5cf6', // Purple for UX/UI
          'marketing': '#f59e0b', // Amber for marketing  
          'development': '#3b82f6', // Blue for development
          'design': '#ec4899', // Pink for design
          'business': '#10b981', // Green for business
        };
        setBadgeColor(customColors[lowerCategory as keyof typeof customColors] || currentTheme.tier1.default || '#6b7280');
      }
    } else if (type === "tier2") {
      // Get color from the current theme for tier2 categories
      const lowerCategory = category.toLowerCase().replace(/\s+/g, ' ').trim();
      if (lowerCategory in currentTheme.tier2) {
        setBadgeColor(currentTheme.tier2[lowerCategory as keyof typeof currentTheme.tier2]);
      } else {
        // For custom tier2 categories, provide fallback colors
        const customTier2Colors = {
          'website design': '#3b82f6', // Blue for website design
          'mobile app': '#10b981', // Green for mobile app
          'api development': '#f59e0b', // Amber for API development
          'user research': '#ec4899', // Pink for user research
          'branding': '#8b5cf6', // Purple for branding
          'content creation': '#06b6d4', // Cyan for content
        };
        setBadgeColor(customTier2Colors[lowerCategory as keyof typeof customTier2Colors] || currentTheme.tier2.other || '#6b7280');
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
  
  // Convert hex to rgba for proper opacity
  const hexToRgba = (hex: string, opacity: number) => {
    if (!hex || !hex.startsWith('#')) return `rgba(107, 114, 128, ${opacity})`; // fallback to gray
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      className
    )} style={{
      backgroundColor: hexToRgba(badgeColor, 0.15),
      borderColor: badgeColor || '#6b7280',
      color: badgeColor || '#6b7280'
    }}>
      {formatCategoryName(category)}
    </div>
  );
}