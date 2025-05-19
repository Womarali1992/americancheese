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
import { getThemeTier2Color } from "@/lib/color-themes";

/**
 * Converts a hex color to a lighter version
 * @param hexColor - The hex color to lighten
 * @param amount - How much to lighten (0-1)
 */
const lightenColor = (hexColor: string, amount: number = 0.85): string => {
  // Remove the # if it exists
  hexColor = hexColor.replace('#', '');
  
  // Parse the hex color
  let r = parseInt(hexColor.substring(0, 2), 16);
  let g = parseInt(hexColor.substring(2, 4), 16);
  let b = parseInt(hexColor.substring(4, 6), 16);
  
  // Lighten the color
  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Gets a light version of the color for a given category
 * @param category - The tier2 category name
 */
const getLightColorForCategory = (category: string): string => {
  if (!category) return '#ebf5ff'; // Default light blue
  
  // Get the category color from the theme
  const categoryColor = getThemeTier2Color(category.toLowerCase());
  
  // Return a lighter version of the color
  return lightenColor(categoryColor);
};

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
      {/* Status indicator pill at top-right corner */}
      <div className="absolute top-0 right-0 mr-4 mt-4">
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          labor.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
          labor.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
          'bg-slate-50 text-slate-700 border border-slate-100'
        }`}>
          {labor.status === 'completed' ? 'Completed' : 
           labor.status === 'in_progress' ? 'In Progress' : 
           'Pending'}
        </div>
      </div>

      {/* Clean, minimal header with worker name */}
      <div 
        style={{
          backgroundColor: labor.tier2Category ? 
            getLightColorForCategory(labor.tier2Category) : 
            '#ebf5ff',
          borderBottomWidth: '1px',
          borderBottomColor: labor.tier2Category ?
            `${getThemeTier2Color(labor.tier2Category.toLowerCase())}33` : // 20% opacity
            '#dbeafe' // light blue border
        }}
        className="px-5 py-4"
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              {labor.tier2Category && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{
                    backgroundColor: labor.tier2Category ? 
                      getThemeTier2Color(labor.tier2Category.toLowerCase()) : 
                      '#3b82f6'
                  }}
                >
                  {labor.tier2Category}
                </span>
              )}
              {labor.tier1Category && (
                <span className="text-xs font-normal"
                  style={{
                    color: labor.tier2Category ? 
                      getThemeTier2Color(labor.tier2Category.toLowerCase()) : 
                      '#3b82f6'
                  }}
                >
                  {labor.tier1Category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2"
                style={{
                  backgroundColor: labor.tier2Category ? 
                    `${getThemeTier2Color(labor.tier2Category.toLowerCase())}22` : // 13% opacity
                    '#dbeafe'
                }}
              >
                {getIconForMaterialTier(
                  labor.tier1Category?.toLowerCase() || 'systems', 
                  `h-5 w-5`
                )}
              </div>
              <CardTitle className="card-header">
                {labor.fullName}
              </CardTitle>
            </div>
            {labor.company && (
              <div className="mt-1 text-sm text-slate-500">
                {labor.company}
              </div>
            )}
          </div>

          {/* Actions menu - updated with modern styling */}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-slate-500 hover:bg-blue-100 hover:text-blue-700 rounded-full"
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
                  }} className="cursor-pointer text-slate-700">
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

      {/* Card content with clean, minimal layout */}
      <CardContent className="p-6">
        {/* Time and hours info in a clean, minimal format */}
        <div className="flex items-center justify-between mb-5 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div className="flex flex-col items-center">
            <p className="text-xs text-slate-500 font-medium uppercase">Start</p>
            <p className="font-medium text-slate-700">{labor.startDate ? formatDate(labor.startDate) : 'N/A'}</p>
          </div>
          <div className="h-6 border-r border-slate-200"></div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-slate-500 font-medium uppercase">End</p>
            <p className="font-medium text-slate-700">{labor.endDate ? formatDate(labor.endDate) : 'N/A'}</p>
          </div>
          <div className="h-6 border-r border-slate-200"></div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
            <p className="font-medium text-slate-700">{labor.totalHours ?? 0} hrs</p>
          </div>
        </div>
        
        {/* Work area and daily schedule in modern grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-full bg-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 font-medium">Work Area</p>
            </div>
            <p className="text-sm text-slate-700">{labor.areaOfWork || "Not specified"}</p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-full bg-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 font-medium">Daily Schedule</p>
            </div>
            <p className="text-sm text-slate-700">
              {labor.startTime && labor.endTime ? 
                `${labor.startTime} - ${labor.endTime}` : "Not specified"}
            </p>
          </div>
        </div>
        
        {/* Clean, minimal collapsible task details section */}
        {labor.taskDescription && (
          <Collapsible 
            open={detailsOpen} 
            onOpenChange={setDetailsOpen}
            className="mt-3"
          >
            <CollapsibleTrigger 
              className="flex items-center justify-center w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 px-4 rounded-md transition-colors duration-200 border border-slate-100 labor-collapsible-trigger"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center">
                <span className="text-sm">View Task Details</span>
                {detailsOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2 text-slate-500" />
                )}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="labor-collapsible-content mt-4">
              <div 
                className="text-sm bg-white border border-slate-100 p-5 rounded-lg text-slate-700"
                onClick={(e) => e.stopPropagation()}
                dangerouslySetInnerHTML={{ __html: taskDescriptionHtml }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Modern view details button */}
        <div className="mt-5">
          <Button 
            className="w-full shadow-sm transition-all duration-200"
            style={{
              backgroundColor: labor.tier2Category ? 
                getLightColorForCategory(labor.tier2Category) : 
                '#ebf5ff',
              color: labor.tier2Category ? 
                getThemeTier2Color(labor.tier2Category.toLowerCase()) : 
                '#3b82f6',
              borderWidth: '1px',
              borderColor: labor.tier2Category ?
                `${getThemeTier2Color(labor.tier2Category.toLowerCase())}33` : // 20% opacity
                '#dbeafe' // light blue border
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (labor.contactId) {
                navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
              }
            }}
          >
            View Complete Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}