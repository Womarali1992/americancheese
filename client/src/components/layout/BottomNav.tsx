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
      case "dashboard": return "text-dashboard";
      case "tasks": return "text-task";
      case "materials": return "text-material";
      case "contacts": return "text-contact";
      default: return "text-blue-600";
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 shadow-md flex justify-around md:hidden z-40 safe-area-bottom pb-safe">
      {navItems.map((item) => {
        const isActive = currentTab === item.id;
        const colorClass = getColorClass(item.id);
        
        return (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 flex-1 relative touch-manipulation",
              "focus:outline-none active:bg-slate-50",
              colorClass,
              isActive ? "font-medium" : ""
            )}
            onClick={() => navigateToTab(item.id)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && (
              <span className="absolute top-0 inset-x-0 mx-auto w-10 h-1 rounded-b-full bg-current" />
            )}
            <span className={cn(
              "flex items-center justify-center h-6 mb-1", 
              isActive ? "scale-110 transform transition-transform" : ""
            )}>
              {item.icon}
            </span>
            <span className={cn(
              "text-[10px] leading-tight whitespace-nowrap font-medium",
              isActive ? "opacity-100" : "opacity-80"
            )}>
              {item.label}
            </span>
            
            {/* Active indicator dot for better visibility */}
            {isActive && (
              <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
