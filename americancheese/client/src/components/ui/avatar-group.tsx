import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarGroupProps {
  users: {
    name: string;
    image?: string;
  }[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarGroup({ users, max = 3, size = "md", className }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const getSizeClass = (size: string) => {
    switch (size) {
      case "sm":
        return "h-6 w-6 text-xs";
      case "md":
        return "h-8 w-8 text-sm";
      case "lg":
        return "h-10 w-10 text-base";
      default:
        return "h-8 w-8 text-sm";
    }
  };

  const sizeClass = getSizeClass(size);

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleUsers.map((user, index) => (
        <Avatar
          key={index}
          className={cn(sizeClass, "border-2 border-white")}
        >
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name} />
          ) : (
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            sizeClass,
            "flex items-center justify-center rounded-full bg-slate-100 border-2 border-white text-slate-700 font-medium"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
