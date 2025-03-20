import React from "react";
import { cn } from "@/lib/utils";
import { useTabNavigation, useCurrentTab, type TabName } from "@/hooks/useTabNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Sidebar() {
  const { navigateToTab } = useTabNavigation();
  const currentTab = useCurrentTab();

  const navItems: { id: TabName; icon: string; label: string }[] = [
    { id: "dashboard", icon: "ri-dashboard-line", label: "Dashboard" },
    { id: "tasks", icon: "ri-task-line", label: "Tasks" },
    { id: "materials", icon: "ri-box-3-line", label: "Materials & Inventory" },
    { id: "expenses", icon: "ri-money-dollar-circle-line", label: "Expenses & Reports" },
    { id: "contacts", icon: "ri-contacts-line", label: "Contacts" }
  ];

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 z-50">
      <div className="flex flex-col flex-grow bg-white shadow-md pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <h1 className="text-2xl font-bold text-slate-800">BuildFlow</h1>
        </div>
        <div className="mt-2 flex-grow flex flex-col">
          <nav className="flex-1 px-3 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href="#"
                className={cn(
                  "group flex items-center px-3 py-3 text-base font-medium rounded-md",
                  currentTab === item.id
                    ? `bg-${item.id === 'expenses' ? 'expense' : item.id} bg-opacity-10 text-${item.id === 'expenses' ? 'expense' : item.id}`
                    : "text-slate-600 hover:bg-opacity-10 hover:text-slate-900",
                  currentTab !== item.id && 
                    `hover:bg-${item.id === 'expenses' ? 'expense' : item.id} hover:text-${item.id === 'expenses' ? 'expense' : item.id}`
                )}
                onClick={(e) => {
                  e.preventDefault();
                  navigateToTab(item.id);
                }}
              >
                <i className={cn(item.icon, "text-xl mr-3")}></i>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
        <div className="px-4">
          <div className="border-t border-slate-200 pt-4 mt-4">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-700">Michael Rodriguez</p>
                <p className="text-xs text-slate-500">Project Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
