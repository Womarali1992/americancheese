import React from "react";
import { useCurrentTab } from "@/hooks/useTabNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "./Logo";
import { 
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
      case "tasks": return <CheckSquare className="h-4 w-4 mr-1" />;
      case "materials": return <Package className="h-4 w-4 mr-1" />;
      case "contacts": return <Users className="h-4 w-4 mr-1" />;
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
  let displayTitle = title || currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
  
  // For "All Projects" title that might be too long, truncate or shorten
  if (displayTitle === "All Projects") {
    displayTitle = "Projects";
  }

  // Determine if we should show the back button based on props or if we're on a detail page
  const showBackButton = backButton || isDetailPage;

  return (
    <header className={`bg-gradient-to-r ${getHeaderGradient()} backdrop-blur-md shadow-sm py-2.5 px-3 fixed top-0 left-0 right-0 z-40 md:hidden border-b border-gray-100 overflow-hidden w-full`}>
      <div className="flex items-center justify-between w-full min-w-0">
        {!title && !showBackButton ? (
          <div 
            className="flex items-center overflow-hidden min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <Logo className="h-6 w-6 text-primary mr-2 flex-shrink-0" />
            <div className="overflow-hidden min-w-0">
              <h1 className="text-base font-semibold tracking-tight text-gray-800 truncate">SiteSetups</h1>
              <p className="text-xs text-gray-500 -mt-1 truncate">Construction Management</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center overflow-hidden min-w-0 flex-1">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-1 p-1 h-8 w-8 flex-shrink-0" 
                onClick={handleBack}
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center overflow-hidden min-w-0 flex-1">
              <div 
                className="flex items-center overflow-hidden min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  if (currentTab === 'tasks') {
                    navigate('/tasks');
                  } else if (currentTab === 'materials') {
                    navigate('/materials');
                  } else if (currentTab === 'contacts') {
                    navigate('/contacts');
                  } else if (currentTab === 'projects') {
                    navigate('/projects');
                  } else {
                    navigate('/');
                  }
                }}
              >
                {getTabIcon()}
                <h1 className={`text-sm font-semibold tracking-tight truncate ${getTabColor()}`}>
                  {displayTitle}
                </h1>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Context-aware action buttons for specific pages - reduced on mobile */}
          {(currentTab === 'tasks' || currentTab === 'materials' || currentTab === 'contacts') && !isDetailPage && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-gray-500 rounded-full p-1 h-7 w-7"
              aria-label={`Add new ${currentTab.slice(0, -1)}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          
          <Button 
            size="sm"
            variant="ghost" 
            className="text-gray-500 rounded-full ml-0.5 p-0 h-7 w-7 flex-shrink-0"
            aria-label="User profile"
          >
            <Avatar className="h-6 w-6 border border-gray-100 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">MR</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  );
}
