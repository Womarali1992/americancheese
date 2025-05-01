import { cn } from "@/lib/utils";
import { getCategoryColor, formatCategoryName, getTier1CategoryColor } from "@/lib/color-utils";

interface CategoryBadgeProps {
  category: string;
  className?: string;
  variant?: "solid" | "outline";
  type?: "category" | "tier1";
}

export function CategoryBadge({ 
  category, 
  className,
  variant = "solid",
  type = "category" 
}: CategoryBadgeProps) {
  // Use either the regular category colors or the new tier1 colors
  let baseStyle;
  
  if (type === "tier1") {
    // For tier1 categories, use our new earth tone colors
    const bgColor = getTier1CategoryColor(category, 'bg');
    const borderColor = getTier1CategoryColor(category, 'border');
    
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