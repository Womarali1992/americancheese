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
      case "contacts": return "text-contact";
      case "projects": return "text-project";
      case "admin": return "text-primary";
      default: return "text-primary";
    }
  };
  
  const displayTitle = title || currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

  return (
    <header className="bg-gradient-to-r from-gray-50/95 to-white/95 backdrop-blur-md shadow-sm py-3 px-4 fixed top-0 left-0 right-0 z-40 md:hidden border-b border-gray-100">
      <div className="flex items-center justify-between max-w-screen-lg mx-auto">
        {!title ? (
          <div className="flex items-center">
            <Logo className="h-7 w-7 text-primary mr-2.5" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-gray-800">SiteSetups</h1>
              <p className="text-xs text-gray-500 -mt-1">Construction Management Platform</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <h1 className={`text-base sm:text-lg font-semibold tracking-tight truncate max-w-[150px] sm:max-w-xs ${getTabColor()}`}>
              {displayTitle}
            </h1>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button 
            className="text-gray-500 rounded-full p-1.5 hover:bg-gray-50 hover:text-gray-700 active:bg-gray-100 focus:outline-none transition-colors duration-200"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button 
            className="text-gray-500 rounded-full p-1.5 hover:bg-gray-50 hover:text-gray-700 active:bg-gray-100 focus:outline-none transition-colors duration-200"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button 
            className="ml-1 focus:outline-none rounded-full"
            aria-label="User profile"
          >
            <Avatar className="h-8 w-8 border border-gray-100 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">MR</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
}
