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
    // Get color directly from CSS variable if possible
    let themeColor;
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory === 'structural') {
      themeColor = getComputedStyle(document.documentElement).getPropertyValue('--tier1-structural') || getThemeTier1Color(category);
    } else if (lowerCategory === 'systems') {
      themeColor = getComputedStyle(document.documentElement).getPropertyValue('--tier1-systems') || getThemeTier1Color(category);
    } else if (lowerCategory === 'sheathing') {
      themeColor = getComputedStyle(document.documentElement).getPropertyValue('--tier1-sheathing') || getThemeTier1Color(category);
    } else if (lowerCategory === 'finishings') {
      themeColor = getComputedStyle(document.documentElement).getPropertyValue('--tier1-finishings') || getThemeTier1Color(category);
    } else {
      themeColor = getThemeTier1Color(category);
    }
    
    // Make sure the CSS var is properly formatted (it sometimes has extra spaces)
    themeColor = themeColor.trim();
    
    // If the CSS var isn't returning a valid color, fallback to the theme function
    if (!themeColor.startsWith('#')) {
      themeColor = getThemeTier1Color(category);
    }
    
    console.log(`Applied tier1 color for ${category}: ${themeColor}`);
    
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
    // For tier2, we'll continue to use the theme system since they don't have direct CSS vars
    const themeColor = getThemeTier2Color(category);
    console.log(`Applied tier2 color for ${category}: ${themeColor}`);
    
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