import React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title={title} />
      <Sidebar />
      
      <main className="flex-1 overflow-hidden md:ml-64 lg:ml-72 md:pt-0 pt-16 pb-16 md:pb-0">
        <div className="h-full overflow-y-auto px-4 py-6 md:px-6 md:py-8 bg-gradient-to-r from-purple-50 to-purple-100">
          {children}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
