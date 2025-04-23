import React from "react";
import { useCurrentTab } from "@/hooks/useTabNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "./Logo";
import { Menu, Bell, Settings } from "lucide-react";

interface MobileHeaderProps {
  title?: string;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  const currentTab = useCurrentTab();
  
  // Use a color mapping based on current tab (matching the bottom nav colors)
  const getTabColor = () => {
    switch(currentTab) {
      case "dashboard": return "text-dashboard";
      case "tasks": return "text-task";
      case "materials": return "text-material";
      case "expenses": return "text-expense";
      case "contacts": return "text-contact";
      default: return "text-blue-600";
    }
  };
  
  const displayTitle = title || currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

  return (
    <header className="bg-white shadow-sm py-3 px-4 fixed top-0 left-0 right-0 z-40 md:hidden">
      <div className="flex items-center justify-between max-w-screen-lg mx-auto">
        {!title ? (
          <div className="flex items-center">
            <Logo className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-lg font-semibold">SiteSetups</h1>
          </div>
        ) : (
          <div className="flex items-center">
            <h1 className={`text-base sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-xs ${getTabColor()}`}>
              {displayTitle}
            </h1>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button 
            className="text-slate-500 rounded-full p-2 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button 
            className="text-slate-500 rounded-full p-2 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button 
            className="ml-1 focus:outline-none focus:ring-2 focus:ring-slate-200 rounded-full"
            aria-label="User profile"
          >
            <Avatar className="h-8 w-8 border-2 border-slate-200">
              <AvatarFallback>MR</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
}
