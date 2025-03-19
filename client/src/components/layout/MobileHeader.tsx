import React from "react";
import { useCurrentTab } from "@/hooks/useTabNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MobileHeaderProps {
  title?: string;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  const currentTab = useCurrentTab();
  const displayTitle = title || currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

  return (
    <header className="bg-white shadow-sm py-4 px-4 fixed top-0 left-0 right-0 z-40 md:hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{displayTitle}</h1>
        <div className="flex gap-3">
          <button className="text-slate-500 rounded-full p-1.5 hover:bg-slate-100">
            <i className="ri-notification-3-line text-xl"></i>
          </button>
          <button className="text-slate-500 rounded-full p-1.5 hover:bg-slate-100">
            <i className="ri-settings-3-line text-xl"></i>
          </button>
          <button className="ml-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>MR</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
}
