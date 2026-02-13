import React from "react";
import { cn } from "@/lib/utils";
import { useTabNavigation, useCurrentTab, type TabName } from "@/hooks/useTabNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "./Logo";
import { getDynamicModuleColor } from "@/lib/color-themes";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { InvitationsBadge } from "./InvitationsBadge";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNav } from "@/contexts/NavContext";
import { NavPill } from "./NavPill";

export function TopNav() {
  const { navigateToTab } = useTabNavigation();
  const currentTab = useCurrentTab();
  const { user, initials, logout } = useCurrentUser();
  const { pills, actions } = useNav();

  const hasPills = pills.length > 0;

  // Frosted glass module colors: subtle tint + backdrop-blur for professional look
  const navColors: Record<string, { bg: string; border: string; subtitle: string; text: string }> = {
    dashboard: { bg: 'rgba(99, 102, 241, 0.08)',  border: 'rgba(99, 102, 241, 0.20)',  subtitle: 'text-indigo-400', text: 'text-indigo-800' },
    tasks:     { bg: 'rgba(34, 197, 94, 0.08)',   border: 'rgba(34, 197, 94, 0.20)',   subtitle: 'text-green-400',  text: 'text-green-800' },
    calendar:  { bg: 'rgba(6, 182, 212, 0.08)',   border: 'rgba(6, 182, 212, 0.20)',   subtitle: 'text-cyan-400',   text: 'text-cyan-800' },
    materials: { bg: 'rgba(249, 115, 22, 0.08)',  border: 'rgba(249, 115, 22, 0.20)',  subtitle: 'text-orange-400', text: 'text-orange-800' },
    contacts:  { bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.20)', subtitle: 'text-slate-400',  text: 'text-slate-700' },
    admin:     { bg: 'rgba(139, 92, 246, 0.08)',  border: 'rgba(139, 92, 246, 0.20)',  subtitle: 'text-purple-400', text: 'text-purple-800' },
  };
  const activeColors = navColors[currentTab] || navColors.dashboard;

  const navItems: { id: TabName; icon: string; label: string; isAdmin?: boolean }[] = [
    { id: "dashboard", icon: "ri-dashboard-line", label: "Dashboard" },
    { id: "tasks", icon: "ri-task-line", label: "Tasks" },
    { id: "calendar", icon: "ri-calendar-line", label: "Calendar" },
    { id: "materials", icon: "ri-box-3-line", label: "Materials" },
    { id: "contacts", icon: "ri-contacts-line", label: "Contacts" },
    { id: "admin", icon: "ri-settings-4-line", label: "Admin Panel", isAdmin: true }
  ];

  return (
    <nav className="shadow-sm border-b px-4 py-3 transition-colors duration-300 backdrop-blur-md bg-white/85" style={{ backgroundColor: activeColors.bg, borderColor: activeColors.border }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and brand */}
        <div
          className="flex items-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigateToTab("dashboard")}
        >
          <Logo className="h-8 w-8 text-primary mr-3" />
          <div className="hidden sm:block">
            <h1 className={cn("text-xl font-bold tracking-tight", activeColors.text)}>SiteSetups</h1>
            <p className={cn("text-xs hidden md:block", activeColors.subtitle)}>Automated Development Platform</p>
          </div>
        </div>

        {/* Center zone: Pills */}
        {hasPills && (
          <div className="hidden md:flex items-center gap-1.5">
            {pills.map((pill) => (
              <NavPill
                key={pill.id}
                icon={pill.icon}
                count={pill.count}
                label={pill.label}
                navigateTo={pill.navigateTo}
                color={pill.color}
                isActive={pill.isActive}
                onClick={() => navigateToTab(pill.navigateTo === '/' ? 'dashboard' : pill.navigateTo.slice(1) as TabName)}
              />
            ))}
          </div>
        )}

        {/* Right zone: Search + avatar (pills mode) OR standard nav tabs */}
        <div className="flex items-center space-x-1">
          {hasPills ? (
            <div className="hidden md:flex items-center gap-2">
              <GlobalSearch />
            </div>
          ) : (
            /* Standard navigation tabs */
            <>
              {navItems.filter(item => !item.isAdmin).map((item) => {
                const isActive = currentTab === item.id;
                const itemColor = navColors[item.id]?.border || activeColors.border;

                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToTab(item.id);
                    }}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150",
                      isActive
                        ? "bg-white font-medium shadow-sm"
                        : "text-slate-600 hover:bg-black/5 hover:text-slate-900",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
                    )}
                    style={isActive ? { color: itemColor } : undefined}
                  >
                    <i
                      className={cn(
                        item.icon,
                        "text-lg mr-2",
                        isActive ? "" : "text-slate-400"
                      )}
                      style={isActive ? { color: itemColor } : undefined}
                    />
                    <span className="hidden sm:block">{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Admin section - visible in standard nav mode */}
          {!hasPills && (
            <div className="ml-4 pl-4 border-l border-slate-200">
              {navItems.filter(item => item.isAdmin).map((item) => {
                const isActive = currentTab === item.id;
                const itemColor = navColors[item.id]?.border || activeColors.border;

                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToTab(item.id);
                    }}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150",
                      isActive
                        ? "bg-white font-medium shadow-sm"
                        : "text-slate-600 hover:bg-black/5 hover:text-slate-900",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
                    )}
                    style={isActive ? { color: itemColor } : undefined}
                  >
                    <i
                      className={cn(
                        item.icon,
                        "text-lg mr-2",
                        isActive ? "" : "text-slate-400"
                      )}
                      style={isActive ? { color: itemColor } : undefined}
                    />
                    <span className="hidden sm:block">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Invitations badge */}
          <InvitationsBadge />

          {/* User profile with dropdown */}
          <div className="ml-4 pl-4 border-l border-slate-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" disabled>
                  <User className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
