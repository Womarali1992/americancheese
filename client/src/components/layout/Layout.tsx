import React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  fullWidth?: boolean;
}

export function Layout({ children, title, fullWidth = false }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-screen bg-[#FCFCFD] overflow-x-hidden">
      <MobileHeader title={title} />
      <Sidebar />
      
      <main 
        className={`
          flex-1 overflow-hidden w-full min-w-0
          md:ml-64 lg:ml-72
          md:pt-0 pt-[60px] pb-[68px] md:pb-0
          transition-all duration-200
        `}
      >
        <div 
          className={`
            h-full overflow-y-auto overflow-x-hidden overscroll-contain w-full min-w-0
            px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8
            ${fullWidth ? 'max-w-none' : 'max-w-7xl mx-auto'}
          `}
        >
          {/* Content container with safe area padding */}
          <div className={`
            ${isMobile ? "pb-4" : ""}
            min-h-[calc(100vh-160px)]
            focus:outline-none
            space-y-4 sm:space-y-6
            w-full min-w-0
          `}>
            {children}
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
