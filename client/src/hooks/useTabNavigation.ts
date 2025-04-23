import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export type TabName = "projects" | "tasks" | "dashboard" | "expenses" | "contacts" | "materials" | "admin";

export const getModuleColor = (tab: TabName): string => {
  const colors: Record<TabName, string> = {
    projects: "project", // brown #7E6551
    tasks: "task", // teal #466362
    dashboard: "dashboard", // slate #8896AB
    expenses: "expense", // teal #466362
    contacts: "contact", // blue #C5D5E4
    materials: "material", // taupe #938581 (with orange highlight)
    admin: "admin" // purple #724C9D
  };
  return colors[tab];
};

export const getModuleUrl = (tab: TabName): string => {
  const urls: Record<TabName, string> = {
    dashboard: "/",
    projects: "/projects",
    tasks: "/tasks",
    expenses: "/expenses",
    contacts: "/contacts",
    materials: "/materials",
    admin: "/admin"
  };
  return urls[tab];
};

export const useTabNavigation = () => {
  const [activeTab, setActiveTab] = useState<TabName>("dashboard");
  const [, setLocation] = useLocation();

  const navigateToTab = (tab: TabName) => {
    setActiveTab(tab);
    setLocation(getModuleUrl(tab));
  };

  return { activeTab, navigateToTab, getModuleColor, getModuleUrl };
};

export const useCurrentTab = (): TabName => {
  const [location] = useLocation();
  const [currentTab, setCurrentTab] = useState<TabName>("dashboard");
  
  useEffect(() => {
    if (location === "/") {
      setCurrentTab("dashboard");
    } else if (location.startsWith("/projects")) {
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
    } else if (location.startsWith("/admin")) {
      setCurrentTab("admin");
    }
  }, [location]);
  
  return currentTab;
};
