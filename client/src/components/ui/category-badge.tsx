import { cn } from "@/lib/utils";
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
  const [badgeColor, setBadgeColor] = useState<string>('#6b7280');
  
  useEffect(() => {
    if (color) {
      setBadgeColor(color);
    } else {
      // Use default color if none provided
      setBadgeColor('#6b7280');
    }
  }, [color]);
  
  // Helper function to lighten color for background
  const lightenColor = (color: string, amount: number = 0.9) => {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * amount * 100);
    
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  };

  if (variant === "outline") {
    return (
      <div 
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-white",
          onClick ? "cursor-pointer hover:opacity-80" : "",
          className
        )} 
        style={{ 
          borderColor: badgeColor,
          color: badgeColor
        }}
        onClick={onClick}
      >
        {category}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        onClick ? "cursor-pointer hover:opacity-80" : "",
        className
      )} 
      style={{
        backgroundColor: lightenColor(badgeColor),
        borderColor: badgeColor,
        color: badgeColor
      }}
      onClick={onClick}
    >
      {category}
      {!color && <span className="ml-1 opacity-50">...</span>}
    </div>
  );
}