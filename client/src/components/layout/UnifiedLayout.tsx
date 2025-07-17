import React, { useEffect } from "react";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";

interface UnifiedLayoutProps {
  children: React.ReactNode;
  title?: string;
  fullWidth?: boolean;
}

export function UnifiedLayout({ children, title, fullWidth = false }: UnifiedLayoutProps) {
  const isMobile = useIsMobile();
  const [location] = useLocation();

  // Handle hash-based navigation for scrolling to sections
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div className="flex flex-col h-screen bg-[#FCFCFD] overflow-x-hidden">
      {/* Mobile header for mobile view */}
      {isMobile && <MobileHeader title={title} />}
      
      {/* Top navigation for desktop view */}
      {!isMobile && <TopNav />}
      
      <main 
        className={`
          flex-1 overflow-hidden w-full min-w-0
          ${isMobile ? 'pt-[60px] pb-[68px]' : 'pt-0 pb-0'}
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
            min-h-[calc(100vh-120px)]
            focus:outline-none
            space-y-8 sm:space-y-12
            w-full min-w-0
          `}>
            {children}
          </div>
        </div>
      </main>
      
      {/* Bottom navigation for mobile view */}
      {isMobile && <BottomNav />}
    </div>
  );
}