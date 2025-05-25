import React from "react";
import { cn } from "@/lib/utils";
import { useTabNavigation, useCurrentTab, type TabName } from "@/hooks/useTabNavigation";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Package, 
  DollarSign, 
  Users 
} from "lucide-react";

export function BottomNav() {
  const { navigateToTab } = useTabNavigation();
  const currentTab = useCurrentTab();

  // Using Lucide icons for better visual consistency
  const navItems: { id: TabName; icon: React.ReactNode; label: string }[] = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { id: "tasks", icon: <CheckSquare size={20} />, label: "Tasks" },
    { id: "materials", icon: <Package size={20} />, label: "Materials" },
    { id: "contacts", icon: <Users size={20} />, label: "Contacts" }
  ];
  
  // Mapping color classes
  const getColorClass = (itemId: TabName) => {
    if (currentTab !== itemId) return "text-slate-600";
    
    switch(itemId) {
      case "dashboard": return "bg-dashboard text-white rounded-md";
      case "tasks": return "bg-task text-white rounded-md";
      case "materials": return "bg-material text-white rounded-md";
      case "contacts": return "bg-contact text-white rounded-md";
      default: return "bg-primary text-white rounded-md";
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 shadow-sm flex justify-around md:hidden z-40 safe-area-bottom pb-safe backdrop-blur-lg bg-white/90">
      {navItems.map((item) => {
        const isActive = currentTab === item.id;
        const colorClass = getColorClass(item.id);
        
        return (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 mx-1 flex-1 relative touch-manipulation",
              "focus:outline-none transition-colors duration-200",
              colorClass,
              isActive ? "font-medium" : ""
            )}
            onClick={() => navigateToTab(item.id)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={cn(
              "flex items-center justify-center h-6 mb-1", 
              isActive ? "scale-110 transform transition-transform duration-200" : "",
              isActive ? "" : "opacity-90"
            )}>
              {item.icon}
            </span>
            <span className={cn(
              "text-[11px] leading-tight whitespace-nowrap font-medium tracking-tight",
              isActive ? "" : "opacity-70",
              "transition-opacity duration-200"
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
