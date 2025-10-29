import React from "react";
import { cn } from "@/lib/utils";
import { useTabNavigation, useCurrentTab, type TabName } from "@/hooks/useTabNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "./Logo";
import { getDynamicModuleColor } from "@/lib/color-themes";

export function TopNav() {
  const { navigateToTab } = useTabNavigation();
  const currentTab = useCurrentTab();

  const navItems: { id: TabName; icon: string; label: string; isAdmin?: boolean }[] = [
    { id: "dashboard", icon: "ri-dashboard-line", label: "Dashboard" },
    { id: "tasks", icon: "ri-task-line", label: "Tasks" },
    { id: "materials", icon: "ri-box-3-line", label: "Materials" },
    { id: "contacts", icon: "ri-contacts-line", label: "Contacts" },
    { id: "admin", icon: "ri-settings-4-line", label: "Admin Panel", isAdmin: true }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and brand */}
        <div className="flex items-center flex-shrink-0">
          <Logo className="h-8 w-8 text-primary mr-3" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">SiteSetups</h1>
            <p className="text-xs text-gray-500 hidden md:block">Construction Management Platform</p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex items-center space-x-1">
          {navItems.filter(item => !item.isAdmin).map((item) => {
            const isActive = currentTab === item.id;
            const moduleColors = getDynamicModuleColor(item.id);
            
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  navigateToTab(item.id);
                }}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150",
                  "hover:bg-gray-50 hover:text-gray-900",
                  isActive ? "bg-white border-2 font-medium shadow-sm" : "text-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                )}
                style={{
                  ...(isActive ? {
                    borderColor: moduleColors.borderColor,
                    color: moduleColors.textColor
                  } : {})
                }}
              >
                <i 
                  className={cn(
                    item.icon, 
                    "text-lg mr-2",
                    isActive ? "text-current" : "text-gray-400"
                  )}
                  style={isActive ? { color: moduleColors.primaryColor } : {}}
                />
                <span className="hidden sm:block">{item.label}</span>
              </button>
            );
          })}

          {/* Admin section */}
          <div className="ml-4 pl-4 border-l border-gray-200">
            {navItems.filter(item => item.isAdmin).map((item) => {
              const isActive = currentTab === item.id;
              const moduleColors = getDynamicModuleColor(item.id);
              
              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToTab(item.id);
                  }}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150",
                    "hover:bg-gray-50 hover:text-gray-900",
                    isActive ? "bg-white border-2 font-medium shadow-sm" : "text-gray-600",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  )}
                  style={{
                    ...(isActive ? {
                      borderColor: moduleColors.borderColor,
                      color: moduleColors.textColor
                    } : {})
                  }}
                >
                  <i 
                    className={cn(
                      item.icon, 
                      "text-lg mr-2",
                      isActive ? "text-current" : "text-gray-400"
                    )}
                    style={isActive ? { color: moduleColors.primaryColor } : {}}
                  />
                  <span className="hidden sm:block">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User profile */}
          <div className="ml-4 pl-4 border-l border-gray-200">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                CM
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}