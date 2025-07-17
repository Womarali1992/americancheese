import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Package, 
  Users 
} from "lucide-react";

interface BottomNavProps {
  unified?: boolean;
}

export function BottomNav({ unified = false }: BottomNavProps) {
  const [activeSection, setActiveSection] = useState<string>("dashboard");

  // For unified navigation, use anchor links
  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { id: "tasks", icon: <CheckSquare size={20} />, label: "Tasks" },
    { id: "materials", icon: <Package size={20} />, label: "Materials" },
    { id: "contacts", icon: <Users size={20} />, label: "Contacts" }
  ];

  // Track which section is currently visible
  useEffect(() => {
    if (!unified) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [unified]);
  
  // Mapping color classes
  const getColorClass = (itemId: string) => {
    if (activeSection !== itemId) return "text-slate-600";
    
    switch(itemId) {
      case "dashboard": return "bg-white border-2 border-indigo-500 text-indigo-600 rounded-md";
      case "tasks": return "bg-white border-2 border-green-500 text-green-600 rounded-md";
      case "materials": return "bg-white border-2 border-amber-500 text-amber-600 rounded-md";
      case "contacts": return "bg-white border-2 border-blue-500 text-blue-600 rounded-md";
      default: return "bg-white border-2 border-primary text-primary rounded-md";
    }
  };

  const handleNavigation = (itemId: string) => {
    if (unified) {
      // Scroll to section
      const element = document.getElementById(itemId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Use original navigation logic (fallback)
      window.location.href = `/${itemId === 'dashboard' ? '' : itemId}`;
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 shadow-sm flex justify-around md:hidden z-40 safe-area-bottom pb-safe backdrop-blur-lg bg-white/90">
      {navItems.map((item) => {
        const isActive = activeSection === item.id;
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
            onClick={() => handleNavigation(item.id)}
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
