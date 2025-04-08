import React, { useState } from "react";
import { ChevronDown, ChevronUp, Edit, MoreHorizontal, Trash } from "lucide-react";
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
  workDate: string;
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
  onEdit: (labor: Labor | SimplifiedLabor) => void;
  onDelete: (laborId: number) => void;
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
  // State for collapsible details section
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Convert details text to HTML with clickable links
  const taskDescriptionHtml = labor.taskDescription ? convertLinksToHtml(labor.taskDescription) : "";
  
  return (
    <Card key={labor.id} className="overflow-hidden border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow rounded-lg">
      {/* Grey header with blue border top and worker name */}
      <div className="bg-gray-50 px-4 py-3 border-t-4 border-blue-500 rounded-t-lg">
        <div className="flex flex-col">
          <div className="flex justify-between mb-1">
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-medium text-[10px]">
              {labor.tier2Category || 'Other'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-200">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(labor)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${labor.fullName}"?`)) {
                      onDelete(labor.id);
                    }
                  }}
                  className="text-red-600"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {getIconForMaterialTier('systems', "h-12 w-12")} {/* Using systems because this is labor related */}
            <CardTitle className="text-base font-bold text-gray-800 font-sans">{labor.fullName}</CardTitle>
          </div>
        </div>
      </div>

      {/* Card content with simplified and improved layout */}
      <CardContent className="p-4 pt-3">
        {/* Classification section with bubble tags */}
        {(labor.tier1Category || labor.tier2Category || labor.company) && (
          <div className="mb-3 border-b pb-2">
            <p className="text-muted-foreground mb-1 font-medium text-xs uppercase">Classification</p>
            <div className="flex flex-wrap gap-1">
              {labor.tier1Category && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {labor.tier1Category}
                </span>
              )}
              {labor.tier2Category && (
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                  {labor.tier2Category}
                </span>
              )}
              {labor.company && (
                <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-800">
                  {labor.company}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Labor details in grid layout */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground font-medium text-xs uppercase">Work Date</p>
            <p className="font-medium mt-1 font-sans">
              {formatDate(labor.workDate)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium text-xs uppercase">Area of Work</p>
            <p className="font-medium mt-1 font-sans">{labor.areaOfWork || "Not specified"}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium text-xs uppercase">Time Period</p>
            <p className="font-medium mt-1 font-sans">
              {formatDate(labor.startDate)} - {formatDate(labor.endDate)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium text-xs uppercase">Total Hours</p>
            <p className="font-medium mt-1 text-blue-700 font-sans">
              {labor.totalHours ?? "N/A"} hrs
            </p>
          </div>
        </div>
        
        {/* Collapsible additional details section */}
        {labor.taskDescription && (
          <Collapsible 
            open={detailsOpen} 
            onOpenChange={setDetailsOpen}
            className="mt-3 pt-3 border-t"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-md px-1">
                <p className="text-muted-foreground font-medium text-xs capitalize mb-1">Task Description</p>
                {detailsOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                )}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div 
                className="text-sm mt-2 px-1"
                dangerouslySetInnerHTML={{ __html: taskDescriptionHtml }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Contact information section */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-muted-foreground font-medium text-xs uppercase mb-2">Contact Information</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {labor.phone && (
              <div>
                <p className="text-muted-foreground font-medium text-xs">Phone</p>
                <p className="font-medium">{labor.phone}</p>
              </div>
            )}
            {labor.email && (
              <div>
                <p className="text-muted-foreground font-medium text-xs">Email</p>
                <p className="font-medium">{labor.email}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Productivity section */}
        {labor.unitsCompleted && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-muted-foreground font-medium text-xs uppercase mb-2">Productivity</p>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground font-medium text-xs">Units Completed</p>
                <p className="font-medium">{labor.unitsCompleted}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}