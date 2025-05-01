import { cn } from "@/lib/utils";
import { 
  getCategoryColor, 
  formatCategoryName, 
  getTier1CategoryColor, 
  getTier2CategoryColor,
  getCategoryColorValues 
} from "@/lib/color-utils";
import { getThemeTier1Color, getThemeTier2Color } from "@/lib/color-themes";

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
  // Use color from database when provided (important override)
  // Otherwise use either the regular category colors or the new tier1/tier2 colors
  let baseStyle;
  
  if (color) {
    // Use custom color from database if provided
    // Assume color is a valid hex color (e.g. #123456)
    return (
      <div className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variant === "outline" ? "bg-white" : "",
        className
      )} style={{ 
        backgroundColor: variant === "outline" ? "white" : color,
        borderColor: color,
        color: variant === "outline" ? color : "white"
      }}>
        {formatCategoryName(category)}
      </div>
    );
  } else if (type === "tier1") {
    // Get color from our theme system
    const themeColor = getThemeTier1Color(category);
    baseStyle = `text-white`;
    
    // Use CSS variable or theme color as a fallback
    return (
      <div className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        className
      )} style={{ 
        backgroundColor: themeColor,
        borderColor: themeColor,
        color: 'white'
      }}>
        {formatCategoryName(category)}
      </div>
    );
  } else if (type === "tier2") {
    // Get color from our theme system
    const themeColor = getThemeTier2Color(category);
    baseStyle = `text-white`;
    
    // Use CSS variable or theme color as a fallback
    return (
      <div className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        className
      )} style={{ 
        backgroundColor: themeColor,
        borderColor: themeColor,
        color: 'white'
      }}>
        {formatCategoryName(category)}
      </div>
    );
  } else {
    // For regular categories, use the existing category colors but handle dynamically
    const { baseColor, textColor } = getCategoryColorValues(category);
    
    return (
      <div className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variant === "outline" ? "bg-white" : "",
        className
      )} style={{ 
        backgroundColor: variant === "outline" ? "white" : baseColor,
        borderColor: baseColor,
        color: variant === "outline" ? baseColor : textColor || "white"
      }}>
        {formatCategoryName(category)}
      </div>
    );
  }
}