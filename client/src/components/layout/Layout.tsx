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
    <div className="flex flex-col h-screen bg-slate-50">
      <MobileHeader title={title} />
      <Sidebar />
      
      <main 
        className={`
          flex-1 overflow-hidden
          md:ml-64 lg:ml-72
          md:pt-0 pt-16 pb-20 md:pb-0
          transition-all duration-200
        `}
      >
        <div 
          className={`
            h-full overflow-y-auto
            px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6
            ${fullWidth ? 'max-w-none' : 'max-w-7xl mx-auto'}
          `}
        >
          {/* Safe area padding for mobile devices */}
          <div className={isMobile ? "pb-4" : ""}>
            {children}
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
