import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export type TabName = "projects" | "tasks" | "dashboard" | "expenses" | "contacts" | "materials";

export const getModuleColor = (tab: TabName): string => {
  const colors: Record<TabName, string> = {
    projects: "project",
    tasks: "task",
    dashboard: "dashboard",
    expenses: "expense",
    contacts: "contact",
    materials: "material"
  };
  return colors[tab];
};

export const getModuleUrl = (tab: TabName): string => {
  const urls: Record<TabName, string> = {
    projects: "/",
    tasks: "/tasks",
    dashboard: "/dashboard",
    expenses: "/expenses",
    contacts: "/contacts",
    materials: "/materials"
  };
  return urls[tab];
};

export const useTabNavigation = () => {
  const [activeTab, setActiveTab] = useState<TabName>("projects");
  const [, setLocation] = useLocation();

  const navigateToTab = (tab: TabName) => {
    setActiveTab(tab);
    setLocation(getModuleUrl(tab));
  };

  return { activeTab, navigateToTab, getModuleColor, getModuleUrl };
};

export const useCurrentTab = (): TabName => {
  const [location] = useLocation();
  const [currentTab, setCurrentTab] = useState<TabName>("projects");
  
  useEffect(() => {
    if (location === "/" || location.startsWith("/projects")) {
      setCurrentTab("projects");
    } else if (location.startsWith("/tasks")) {
      setCurrentTab("tasks");
    } else if (location.startsWith("/dashboard")) {
      setCurrentTab("dashboard");
    } else if (location.startsWith("/expenses")) {
      setCurrentTab("expenses");
    } else if (location.startsWith("/contacts")) {
      setCurrentTab("contacts");
    } else if (location.startsWith("/materials")) {
      setCurrentTab("materials");
    }
  }, [location]);
  
  return currentTab;
};
