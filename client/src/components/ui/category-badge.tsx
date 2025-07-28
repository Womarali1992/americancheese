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
  onClick?: () => void;
}

export function CategoryBadge({ 
  category, 
  className,
  variant = "solid",
  type = "category",
  color = null,
  onClick
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
      // Use the same exact color mapping as dashboard badges
      const lowerCategory = category.toLowerCase();
      
      // Use the same colors as the dashboard badges based on your specifications:
      // UX/UI = red, ALI = green, General questions = grey
      if (lowerCategory.includes('ux') || lowerCategory.includes('ui')) {
        setBadgeColor('#dc2626'); // red-600
      } else if (lowerCategory.includes('ali') || lowerCategory.includes('apartment')) {
        setBadgeColor('#16a34a'); // green-600
      } else if (lowerCategory.includes('general') || lowerCategory.includes('question')) {
        setBadgeColor('#475569'); // slate-600
      } else if (lowerCategory === 'structural' && currentTheme.tier1.structural) {
        setBadgeColor(currentTheme.tier1.structural);
      } else if (lowerCategory === 'systems' && currentTheme.tier1.systems) {
        setBadgeColor(currentTheme.tier1.systems);
      } else if (lowerCategory === 'sheathing' && currentTheme.tier1.sheathing) {
        setBadgeColor(currentTheme.tier1.sheathing);
      } else if (lowerCategory === 'finishings' && currentTheme.tier1.finishings) {
        setBadgeColor(currentTheme.tier1.finishings);
      } else {
        // For other custom tier1 categories, use default theme color
        setBadgeColor(currentTheme.tier1.default || '#6b7280');
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
          'backend': '#f59e0b', // Amber for backend development
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
      <div 
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          "bg-white transition-colors",
          onClick ? "cursor-pointer hover:opacity-80" : "",
          className
        )} 
        style={{ 
          borderColor: badgeColor,
          color: badgeColor
        }}
        onClick={onClick}
      >
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

  // Get the same badge colors as dashboard badges for consistency
  const getBadgeColors = (tier1: string) => {
    const lowerCaseTier1 = tier1.toLowerCase();
    
    // Use the same colors as the dashboard badges
    if (lowerCaseTier1.includes('ux') || lowerCaseTier1.includes('ui')) {
      return {
        bg: '#fef2f2',      // red-50
        border: '#fca5a5',  // red-300
        text: '#dc2626'     // red-600
      };
    }
    
    if (lowerCaseTier1.includes('ali') || lowerCaseTier1.includes('apartment')) {
      return {
        bg: '#f0fdf4',      // green-50
        border: '#86efac',  // green-300
        text: '#16a34a'     // green-600
      };
    }
    
    if (lowerCaseTier1.includes('general') || lowerCaseTier1.includes('question')) {
      return {
        bg: '#f8fafc',      // slate-50
        border: '#cbd5e1',  // slate-300
        text: '#475569'     // slate-600
      };
    }
    
    // Default colors for other categories
    return {
      bg: hexToRgba(badgeColor, 0.15),
      border: badgeColor || '#cbd5e1',
      text: badgeColor || '#475569'
    };
  };

  const colors = type === "tier1" ? getBadgeColors(category) : {
    bg: hexToRgba(badgeColor, 0.15),
    border: badgeColor || '#6b7280',
    text: badgeColor || '#6b7280'
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        onClick ? "cursor-pointer hover:opacity-80" : "",
        className
      )} 
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text
      }}
      onClick={onClick}
    >
      {formatCategoryName(category)}
    </div>
  );
}