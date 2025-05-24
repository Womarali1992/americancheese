import React from "react";
import { useCurrentTab } from "@/hooks/useTabNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "./Logo";
import { 
  Bell, 
  Settings, 
  Filter, 
  Plus, 
  Search, 
  CheckSquare,
  Package, 
  Users,
  ArrowLeft,
  Menu
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileHeaderProps {
  title?: string;
  backButton?: boolean;
}

export function MobileHeader({ title, backButton = false }: MobileHeaderProps) {
  const currentTab = useCurrentTab();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  
  // Get icon based on current tab
  const getTabIcon = () => {
    switch(currentTab) {
      case "tasks": return <CheckSquare className="h-4 w-4 mr-1.5" />;
      case "materials": return <Package className="h-4 w-4 mr-1.5" />;
      case "contacts": return <Users className="h-4 w-4 mr-1.5" />;
      default: return null;
    }
  };
  
  // Use a color mapping based on current tab (matching the bottom nav colors)
  const getTabColor = () => {
    switch(currentTab) {
      case "dashboard": return "text-dashboard";
      case "tasks": return "text-task";
      case "materials": return "text-material";
      case "contacts": return "text-contact";
      case "projects": return "text-project";
      case "admin": return "text-primary";
      default: return "text-primary";
    }
  };
  
  // Get gradient color for header based on current tab
  const getHeaderGradient = () => {
    switch(currentTab) {
      case "tasks": return "from-teal-50/95 to-white/95";
      case "materials": return "from-orange-50/95 to-white/95";
      case "contacts": return "from-blue-50/95 to-white/95";
      default: return "from-gray-50/95 to-white/95";
    }
  };
  
  // Handle back button click
  const handleBack = () => {
    if (location.includes('/tasks/') && currentTab === 'tasks') {
      navigate('/tasks');
    } else if (location.includes('/materials/') && currentTab === 'materials') {
      navigate('/materials');
    } else if (location.includes('/contacts/') && currentTab === 'contacts') {
      navigate('/contacts');
    } else {
      navigate('/');
    }
  };
  
  // Determine if we're on a detail page
  const isDetailPage = location.split('/').length > 2 && !location.endsWith('/');
  
  // Display the appropriate title
  const displayTitle = title || currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

  // Determine if we should show the back button based on props or if we're on a detail page
  const showBackButton = backButton || isDetailPage;

  return (
    <header className={`bg-gradient-to-r ${getHeaderGradient()} backdrop-blur-md shadow-sm py-3 px-3 fixed top-0 left-0 right-0 z-40 md:hidden border-b border-gray-100`}>
      <div className="flex items-center justify-between max-w-screen-lg mx-auto">
        {!title && !showBackButton ? (
          <div className="flex items-center">
            <Logo className="h-7 w-7 text-primary mr-2.5" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-gray-800">SiteSetups</h1>
              <p className="text-xs text-gray-500 -mt-1">Construction Management Platform</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-1 -ml-1.5" 
                onClick={handleBack}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center">
              {getTabIcon()}
              <h1 className={`text-base font-semibold tracking-tight truncate max-w-[130px] sm:max-w-xs ${getTabColor()}`}>
                {displayTitle}
              </h1>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1.5">
          {/* Context-aware action buttons for specific pages */}
          {(currentTab === 'tasks' || currentTab === 'materials' || currentTab === 'contacts') && !isDetailPage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-gray-500 rounded-full"
                    aria-label={`Search ${currentTab}`}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search {currentTab}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {(currentTab === 'tasks' || currentTab === 'materials' || currentTab === 'contacts') && !isDetailPage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-gray-500 rounded-full"
                    aria-label={`Filter ${currentTab}`}
                  >
                    <Filter className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter {currentTab}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {(currentTab === 'tasks' || currentTab === 'materials' || currentTab === 'contacts') && !isDetailPage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-gray-500 rounded-full"
                    aria-label={`Add new ${currentTab.slice(0, -1)}`}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add new {currentTab.slice(0, -1)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-gray-500 rounded-full ml-1"
            aria-label="User profile"
          >
            <Avatar className="h-8 w-8 border border-gray-100 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">MR</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  );
}
