import { cn } from "@/lib/utils";
import { getCategoryColor, formatCategoryName } from "@/lib/color-utils";

interface CategoryBadgeProps {
  category: string;
  className?: string;
  variant?: "solid" | "outline";
}

export function CategoryBadge({ 
  category, 
  className,
  variant = "solid" 
}: CategoryBadgeProps) {
  const baseStyle = getCategoryColor(category);
  
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