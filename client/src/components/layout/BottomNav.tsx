import React from "react";
import { cn } from "@/lib/utils";
import { useTabNavigation, useCurrentTab, type TabName } from "@/hooks/useTabNavigation";

export function BottomNav() {
  const { navigateToTab } = useTabNavigation();
  const currentTab = useCurrentTab();

  const navItems: { id: TabName; icon: string; label: string }[] = [
    { id: "dashboard", icon: "ri-dashboard-line", label: "Dashboard" },
    { id: "tasks", icon: "ri-task-line", label: "Tasks" },
    { id: "materials", icon: "ri-box-3-line", label: "Materials" },
    { id: "expenses", icon: "ri-money-dollar-circle-line", label: "Expenses" },
    { id: "contacts", icon: "ri-contacts-line", label: "Contacts" }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around md:hidden z-40">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-center justify-center py-2 px-1 flex-1",
            currentTab === "dashboard" && item.id === "dashboard" ? "text-dashboard" : "",
            currentTab === "tasks" && item.id === "tasks" ? "text-task" : "",
            currentTab === "materials" && item.id === "materials" ? "text-material" : "",
            currentTab === "expenses" && item.id === "expenses" ? "text-expense" : "",
            currentTab === "contacts" && item.id === "contacts" ? "text-contact" : "",
            currentTab !== item.id ? "text-slate-600" : ""
          )}
          onClick={() => navigateToTab(item.id)}
        >
          <i className={cn(item.icon, "text-xl")}></i>
          <span className="text-xs mt-1 whitespace-nowrap">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
