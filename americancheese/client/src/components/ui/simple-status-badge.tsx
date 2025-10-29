import React from "react";
import { cn } from "@/lib/utils";

interface SimpleStatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function SimpleStatusBadge({ status, className }: SimpleStatusBadgeProps) {
  const safeStatus = status || "unknown";
  
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "active":
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border",
      getStatusStyles(safeStatus),
      className
    )}>
      {formatStatus(safeStatus)}
    </span>
  );
}