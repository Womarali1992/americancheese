import React, { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Edit, MoreHorizontal, Trash } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getIconForMaterialTier } from "@/components/project/iconUtils";
import { Labor } from "@shared/schema";
import { useLocation } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Create a type that makes the Labor type work with the fields we need
export type SimplifiedLabor = {
  id: number;
  fullName: string;
  tier1Category: string;
  tier2Category: string;
  company: string;
  phone: string | null;
  email: string | null;
  projectId: number;
  taskId: number | null;
  contactId: number | null;
  taskDescription: string | null;
  areaOfWork: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  totalHours: number | null;
  unitsCompleted: string | null;
  materialIds: string[] | null;
  status: string;
};

interface LaborCardProps {
  labor: Labor | SimplifiedLabor;
  onEdit?: (labor: Labor | SimplifiedLabor) => void;
  onDelete?: (laborId: number) => void;
}

// Utility function to convert URLs in text to clickable links
const convertLinksToHtml = (text: string) => {
  if (!text) return "";
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Replace URLs with clickable links
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
  });
};

export function LaborCard({ labor, onEdit, onDelete }: LaborCardProps) {
  const [, navigate] = useLocation();
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Convert details text to HTML with clickable links
  const taskDescriptionHtml = labor.taskDescription ? convertLinksToHtml(labor.taskDescription) : "";
  
  // Handler for card click to navigate to labor detail page
  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if we didn't click on the collapsible trigger or content
    const target = e.target as HTMLElement;
    if (!target.closest('.labor-collapsible-trigger') && !target.closest('.labor-collapsible-content')) {
      if (labor.contactId) {
        navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
      }
    }
  };
  
  return (
    <Card 
      key={labor.id} 
      className="overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl cursor-pointer relative"
      onClick={handleCardClick}
    >
      {/* Status indicator dot at top-right corner */}
      <div className="absolute top-0 right-0 mr-4 mt-4">
        <div className={`w-3 h-3 rounded-full ${
          labor.status === 'completed' ? 'bg-green-500' : 
          labor.status === 'in_progress' ? 'bg-amber-500' : 
          'bg-blue-500'
        }`} />
      </div>

      {/* Modern gradient header with worker name */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 px-5 py-4 text-white">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              {labor.tier2Category && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                  {labor.tier2Category}
                </span>
              )}
              {labor.tier1Category && (
                <span className="text-[10px] font-medium opacity-90">
                  {labor.tier1Category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 rounded-full p-2">
                {getIconForMaterialTier('systems', "h-6 w-6 text-white")}
              </div>
              <CardTitle className="text-xl font-semibold text-white">
                {labor.fullName}
              </CardTitle>
            </div>
            {labor.company && (
              <div className="mt-1 text-xs text-white/80 font-medium">
                {labor.company}
              </div>
            )}
          </div>

          {/* Actions menu */}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  onClick={(e) => e.stopPropagation()} 
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(labor);
                  }} className="cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Labor Entry
                  </DropdownMenuItem>
                )}
                {onEdit && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${labor.fullName}"?`)) {
                        if (onDelete) onDelete(labor.id);
                      }
                    }}
                    className="text-red-600 cursor-pointer"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Entry
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Card content with modern, clean layout */}
      <CardContent className="p-5">
        {/* Time and hours info in a visually appealing format */}
        <div className="flex items-center justify-between mb-4 bg-blue-50 p-3 rounded-lg">
          <div className="flex flex-col items-center">
            <p className="text-xs text-blue-600 font-medium uppercase">Start</p>
            <p className="font-medium text-blue-900">{labor.startDate ? formatDate(labor.startDate) : 'N/A'}</p>
          </div>
          <div className="h-6 border-r border-blue-200"></div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-blue-600 font-medium uppercase">End</p>
            <p className="font-medium text-blue-900">{labor.endDate ? formatDate(labor.endDate) : 'N/A'}</p>
          </div>
          <div className="h-6 border-r border-blue-200"></div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-blue-600 font-medium uppercase">Total</p>
            <p className="font-medium text-blue-900">{labor.totalHours ?? 0} hrs</p>
          </div>
        </div>
        
        {/* Work area and daily schedule in flex layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-full bg-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-medium">Work Area</p>
            </div>
            <p className="text-sm font-medium">{labor.areaOfWork || "Not specified"}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-full bg-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-medium">Daily Schedule</p>
            </div>
            <p className="text-sm font-medium">
              {labor.startTime && labor.endTime ? 
                `${labor.startTime} - ${labor.endTime}` : "Not specified"}
            </p>
          </div>
        </div>
        
        {/* Improved collapsible task details section */}
        {labor.taskDescription && (
          <Collapsible 
            open={detailsOpen} 
            onOpenChange={setDetailsOpen}
            className="mt-3"
          >
            <CollapsibleTrigger 
              className="flex items-center justify-center w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-md transition-colors duration-200 labor-collapsible-trigger"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center">
                <span className="text-sm font-medium">View Task Details</span>
                {detailsOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="labor-collapsible-content mt-3">
              <div 
                className="text-sm bg-white border border-gray-100 p-4 rounded-lg shadow-sm"
                onClick={(e) => e.stopPropagation()}
                dangerouslySetInnerHTML={{ __html: taskDescriptionHtml }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Modernized view details button */}
        <div className="mt-5">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              if (labor.contactId) {
                navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
              }
            }}
          >
            View Complete Details
            <ChevronRight className="h-4 w-4 ml-1 opacity-70" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}