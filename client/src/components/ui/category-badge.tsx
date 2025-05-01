import { cn } from "@/lib/utils";
import { getCategoryColor, formatCategoryName, getTier1CategoryColor } from "@/lib/color-utils";

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
    baseStyle = `bg-[${color}] border-[${color}] text-white`;
  } else if (type === "tier1") {
    // For tier1 categories, use our new earth tone colors
    const bgColor = getTier1CategoryColor(category, 'bg');
    const borderColor = getTier1CategoryColor(category, 'border');
    
    baseStyle = `${bgColor} ${borderColor} text-white`;
  } else if (type === "tier2") {
    // For tier2 categories, use our new tier2 colors
    const bgColor = getTier2CategoryColor(category, 'bg');
    const borderColor = getTier2CategoryColor(category, 'border');
    
    baseStyle = `${bgColor} ${borderColor} text-white`;
  } else {
    // For regular categories, use the existing category colors
    baseStyle = getCategoryColor(category);
  }
  
  const style = variant === "outline" 
    ? baseStyle.replace(/bg-[^ ]+/, '') + ' bg-white'
    : baseStyle;
  
  return (
    <div className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      style,
      className
    )}>
      {formatCategoryName(category)}
    </div>
  );
}