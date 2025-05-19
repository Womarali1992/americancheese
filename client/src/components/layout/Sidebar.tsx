import React from "react";
import { cn } from "@/lib/utils";
import { useTabNavigation, useCurrentTab, type TabName } from "@/hooks/useTabNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "./Logo";

export function Sidebar() {
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
    <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 z-50">
      <div className="flex flex-col flex-grow bg-white shadow-sm border-r border-gray-100 pt-6 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6 mb-8">
          <Logo className="h-9 w-9 text-primary mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">SiteSetups</h1>
            <p className="text-xs text-gray-500">Construction Management Platform</p>
          </div>
        </div>
        <div className="flex-grow flex flex-col">
          <nav className="flex-1 px-4 space-y-1">
            {/* Regular nav items */}
            {navItems.filter(item => !item.isAdmin).map((item) => {
              const isActive = currentTab === item.id;
              const getActiveStyles = () => {
                switch(item.id) {
                  case "dashboard": return isActive ? "bg-gray-50 text-dashboard font-medium" : "";
                  case "tasks": return isActive ? "bg-gray-50 text-task font-medium" : "";
                  case "materials": return isActive ? "bg-gray-50 text-material font-medium" : "";
                  case "contacts": return isActive ? "bg-gray-50 text-contact font-medium" : "";
                  default: return isActive ? "bg-gray-50 text-primary font-medium" : "";
                }
              };
              
              return (
                <a
                  key={item.id}
                  href="#"
                  className={cn(
                    "group flex items-center px-4 py-2.5 text-sm rounded-md transition-colors duration-150",
                    getActiveStyles(),
                    !isActive && "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    "no-underline"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToTab(item.id);
                  }}
                >
                  <i className={cn(item.icon, "text-lg mr-3 flex-shrink-0")}></i>
                  <span className="whitespace-nowrap">{item.label}</span>
                </a>
              );
            })}
            
            {/* Admin section */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Administration</p>
              {navItems.filter(item => item.isAdmin).map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <a
                    key={item.id}
                    href="#"
                    className={cn(
                      "group flex items-center px-4 py-2.5 text-sm rounded-md transition-colors duration-150",
                      isActive ? "bg-gray-50 text-gray-800 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      "no-underline"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToTab(item.id);
                    }}
                  >
                    <i className={cn(item.icon, "text-lg mr-3 flex-shrink-0")}></i>
                    <span className="whitespace-nowrap">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </nav>
        </div>
        <div className="px-6">
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex flex-col w-full">
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                <Avatar className="h-10 w-10 border-2 border-gray-100">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">MR</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">Michael Rodriguez</p>
                  <p className="text-xs text-gray-500">Project Manager</p>
                </div>
              </div>
              <button
                className="mt-3 w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
                onClick={() => {
                  // Call logout API
                  fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                    }
                  }).finally(() => {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                  });
                }}
              >
                <i className="ri-logout-box-line mr-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
