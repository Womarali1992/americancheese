import React from "react";

import { TopNav } from "./TopNav";
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
      {isMobile ? <MobileHeader title={title} /> : <TopNav />}

      <main className={`
        flex-1 overflow-hidden w-full min-w-0
        ${isMobile ? 'pt-[60px] pb-[68px]' : 'pt-0 pb-0'}
        transition-all duration-200
      `}>
        <div className={`
          h-full overflow-y-auto overflow-x-hidden overscroll-contain w-full min-w-0
          px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-8 lg:py-4
          ${fullWidth ? 'max-w-none' : 'max-w-7xl mx-auto'}
        `}>
          <div className={`
            ${isMobile ? "pb-4" : ""}
            min-h-[calc(100vh-120px)]
            focus:outline-none space-y-3 sm:space-y-4 w-full min-w-0
          `}>
            {children}
          </div>
        </div>
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
}
