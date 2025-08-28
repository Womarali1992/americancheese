import React from "react";
import { cn } from "@/lib/utils";

interface SimpleProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
}

export function SimpleProgressBar({ 
  progress, 
  className, 
  showLabel = true 
}: SimpleProgressBarProps) {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{clampedProgress}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}