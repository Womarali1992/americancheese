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

  // Lighter module colors for nav bar background (softer than getDynamicModuleColor)
  const navColors: Record<string, { bg: string; border: string; subtitle: string }> = {
    dashboard: { bg: '#a5b4fc', border: '#6366f1', subtitle: 'text-indigo-200' },    // Indigo-300
    tasks:     { bg: '#86efac', border: '#22c55e', subtitle: 'text-green-200' },      // Green-300
    calendar:  { bg: '#67e8f9', border: '#06b6d4', subtitle: 'text-cyan-200' },       // Cyan-300
    materials: { bg: '#fdba74', border: '#f97316', subtitle: 'text-orange-200' },     // Orange-300
    contacts:  { bg: '#cbd5e1', border: '#64748b', subtitle: 'text-slate-200' },      // Slate-300
    admin:     { bg: '#c4b5fd', border: '#8b5cf6', subtitle: 'text-purple-200' },     // Purple-300
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
    <nav className="shadow-sm border-b px-4 py-3 transition-colors duration-300" style={{ backgroundColor: activeColors.bg, borderColor: activeColors.border }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and brand */}
        <div
          className="flex items-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigateToTab("dashboard")}
        >
          <Logo className="h-8 w-8 text-primary mr-3" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-white tracking-tight">SiteSetups</h1>
            <p className={cn("text-xs hidden md:block", activeColors.subtitle)}>Automated Development Platform</p>
          </div>
        </div>

        {/* Center zone: Pills OR Global Search (hidden when actions override) */}
        {hasPills ? (
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
        ) : !actions ? (
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
        ) : null}

        {/* Right zone: Custom actions OR standard nav + always avatar */}
        <div className="flex items-center space-x-1">
          {(hasPills || actions) ? (
            /* When pills or actions are set, render custom actions instead of nav tabs */
            <>
              {actions && (
                <div className="hidden md:flex items-center gap-2">
                  {actions}
                </div>
              )}
            </>
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
                        : "text-white/80 hover:bg-white/15 hover:text-white",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50"
                    )}
                    style={isActive ? { color: itemColor } : undefined}
                  >
                    <i
                      className={cn(
                        item.icon,
                        "text-lg mr-2",
                        isActive ? "" : "text-white/60"
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
          {!hasPills && !actions && (
            <div className="ml-4 pl-4 border-l border-white/25">
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
                        : "text-white/80 hover:bg-white/15 hover:text-white",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50"
                    )}
                    style={isActive ? { color: itemColor } : undefined}
                  >
                    <i
                      className={cn(
                        item.icon,
                        "text-lg mr-2",
                        isActive ? "" : "text-white/60"
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
          <div className="ml-4 pl-4 border-l border-white/25">
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
