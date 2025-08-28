import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const safeStatus = status || "unknown";

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") return "bg-green-100 text-green-800";
    if (s === "active") return "bg-blue-100 text-blue-800";
    if (s === "on_hold" || s === "in_progress" || s === "contractor") return "bg-amber-100 text-amber-800";
    if (s === "supplier") return "bg-blue-100 text-blue-800";
    if (s === "consultant") return "bg-purple-100 text-purple-800";
    return "bg-slate-100 text-slate-800";
  };

  const formatStatusText = (status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", getStatusColor(safeStatus), className)}>
      {formatStatusText(safeStatus)}
    </span>
  );
}
