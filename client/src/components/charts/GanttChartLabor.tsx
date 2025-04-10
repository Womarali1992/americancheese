import React, { useState, useEffect } from "react";
import { format, eachDayOfInterval, addDays, subDays, differenceInDays, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { getStatusBgColor, getStatusBorderColor } from "@/lib/color-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Clock, User, Tag, CheckCircle, ChevronLeft, 
  ChevronRight, Users, Package, Plus, Edit, Info as InfoIcon,
  AlertTriangle as AlertTriangleIcon, Warehouse, ExternalLink,
  Construction, Hammer, Briefcase
} from "lucide-react";
import { Link } from "wouter";
import { EditTaskDialog } from "@/pages/tasks/EditTaskDialog";
// Import both Task and Labor types
import { Task as SchemaTask, Labor as SchemaLabor } from "@/../../shared/schema";
import { TaskAttachments } from "@/components/task/TaskAttachments";
import { queryClient } from "@/lib/queryClient";

// Define a specific type that matches what EditTaskDialog expects
interface EditTaskDialogTask {
  id: number;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  projectId: number;
  completed: boolean; // Note: this must be boolean, not boolean | null
  category: string;
  tier1Category: string;
  tier2Category: string;
  contactIds: string[];
  materialIds: string[];
  materialsNeeded: string;
  templateId: string;
  estimatedCost: number | null;
  actualCost: number | null;
}

// Define a GanttItem interface that extends from the schema Labor type
interface GanttItem {
  id: number;
  title: string;
  description: string | null;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  assignedTo?: string | null;
  category?: string; 
  contactIds?: string[] | null;
  materialIds?: string[] | null;
  projectId: number;
  completed?: boolean | null;
  materialsNeeded?: string | null;
  durationDays?: number;
  hasLinkedLabor: boolean; // Flag to indicate if task is using labor dates
  templateId?: string; // Template ID (e.g., FR3)
  tier1Category?: string;
  tier2Category?: string;
  laborId?: number; // ID of the labor record if this is a labor entry
  totalHours?: number | undefined; // Hours worked for labor entries
  fullName?: string; // Contractor name for labor entries
  company?: string; // Company name for labor entries
  isLaborRecord: boolean; // Flag to indicate this is a labor record, not a task
  taskId?: number; // The associated task ID
}

// Define LaborRecord interface for labor entries in the Gantt chart
interface LaborRecord extends SchemaLabor {
  taskTitle?: string; // From the linked task
  taskTemplateId?: string; // Template ID from the linked task (e.g., FR5)
}

// Helper function to safely parse dates
const safeParseDate = (dateInput: Date | string): Date => {
  // If already a Date object and valid, return it directly
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput;
  }
  
  // Handle string dates
  if (typeof dateInput === 'string') {
    try {
      // Check if the date string is valid
      if (!dateInput || dateInput === 'Invalid date') {
        console.warn("Invalid date string provided:", dateInput);
        return new Date(); // Return current date as fallback
      }
      
      const parsed = parseISO(dateInput);
      if (isValid(parsed)) {
        return parsed;
      } else {
        console.warn("Date parsed but invalid:", dateInput);
      }
    } catch (e) {
      console.error("Error parsing date:", e, dateInput);
    }
  }
  
  // Fallback to current date if parsing fails
  console.warn("Using fallback date for invalid input:", dateInput);
  return new Date();
};

// Convert GanttItem to EditTaskDialogTask for EditTaskDialog
const convertGanttItemToTask = (ganttItem: GanttItem): EditTaskDialogTask => {
  // Ensure dates are properly formatted
  const startDate = safeParseDate(ganttItem.startDate);
  const endDate = safeParseDate(ganttItem.endDate);
  
  // Ensure arrays are properly converted to string arrays
  const stringContactIds = ganttItem.contactIds ? 
    ganttItem.contactIds.map((id: any) => String(id)) : 
    [];
    
  const stringMaterialIds = ganttItem.materialIds ? 
    ganttItem.materialIds.map((id: any) => String(id)) : 
    [];
    
  return {
    id: ganttItem.id,
    title: ganttItem.title,
    description: ganttItem.description || "",
    status: ganttItem.status,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    assignedTo: ganttItem.assignedTo || "",
    projectId: ganttItem.projectId,
    // Ensure completed is always a boolean (not null)
    completed: ganttItem.completed === true, // Convert null/undefined to false
    category: ganttItem.category || "",
    contactIds: stringContactIds,
    materialIds: stringMaterialIds,
    materialsNeeded: ganttItem.materialsNeeded || "",
    // Add missing properties with defaults
    tier1Category: ganttItem.tier1Category || "",
    tier2Category: ganttItem.tier2Category || "",
    templateId: ganttItem.templateId || "",
    estimatedCost: null,
    actualCost: null
  };
};

interface GanttChartProps {
  className?: string;
  tasks?: any[]; // Accept tasks prop but don't use it directly
  onAddTask?: () => void;
  onUpdateTask?: (id: number, task: Partial<SchemaTask>) => void;
}

export function GanttChartLabor({
  className,
  onAddTask,
  onUpdateTask,
}: GanttChartProps) {
  // State for storing labor records
  const [laborRecords, setLaborRecords] = useState<LaborRecord[]>([]);
  // State for storing task map for quick lookup
  const [taskMap, setTaskMap] = useState<{[key: number]: SchemaTask}>({});
  // State for Gantt items to display (converted from labor records)
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  
  // State to track the refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Effect to invalidate the task data cache and trigger a refresh
  useEffect(() => {
    // Force refresh the labor data every 10 seconds
    const refreshIntervalId = setInterval(() => {
      console.log("Force refreshing Gantt chart with labor data...");
      
      // Invalidate queries to force fresh fetches
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labor'] });
      
      // Update the refresh trigger to force component updates
      setRefreshTrigger(prev => prev + 1);
    }, 10000); // Every 10 seconds
    
    return () => {
      clearInterval(refreshIntervalId);
    };
  }, []);
  
  // Effect to fetch labor records and tasks directly
  useEffect(() => {
    // Helper function to fetch tasks
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const taskData = await response.json();
        
        // Create a map of task IDs to task objects for quick lookup
        const taskMapping: {[key: number]: SchemaTask} = {};
        taskData.forEach((task: SchemaTask) => {
          taskMapping[task.id] = task;
        });
        
        setTaskMap(taskMapping);
        return taskMapping;
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return {};
      }
    };
    
    // Helper function to fetch all labor records
    const fetchLaborRecords = async () => {
      try {
        const response = await fetch('/api/labor');
        if (!response.ok) throw new Error('Failed to fetch labor records');
        const laborData = await response.json();
        return laborData;
      } catch (error) {
        console.error('Error fetching labor records:', error);
        return [];
      }
    };
    
    // Main function to fetch and process all data
    const fetchAllData = async () => {
      const taskMapping = await fetchTasks();
      const laborData = await fetchLaborRecords();
      
      console.log(`Fetched ${laborData.length} labor records`);
      
      // Enhance labor records with task information
      const enhancedLaborRecords: LaborRecord[] = laborData.map((labor: SchemaLabor) => {
        const associatedTask = labor.taskId ? taskMapping[labor.taskId] : null;
        
        // Skip enhancing if no associated task was found
        if (!associatedTask) {
          return labor;
        }
        
        // Add task information to the labor record
        return {
          ...labor,
          taskTitle: associatedTask.title,
          taskTemplateId: associatedTask.templateId,
        };
      });
      
      setLaborRecords(enhancedLaborRecords);
      
      // Convert labor records to GanttItems
      const items = enhancedLaborRecords.map(labor => {
        const associatedTask = labor.taskId ? taskMapping[labor.taskId] : null;
        
        // Create a title based on task info and labor info
        let title = labor.fullName;
        if (associatedTask) {
          // Special handling for different task IDs
          if (labor.taskId === 3646) {
            title = "Plan and bid materials/labor for framing – FR1";
          } else if (labor.taskId === 3648) {
            title = "Supervise Framing and Install Subfloor and First Floor Joists – FR3";
          } else if (labor.taskId === 3649) {
            title = "Frame exterior walls and interior partitions – FR4";
          } else if (labor.taskId === 3650) {
            title = "Frame and Align Second Floor Structure – FR5";
          } else {
            // For other tasks, combine task title with contractor name
            title = `${associatedTask.title} - ${labor.fullName}`;
          }
        }
        
        // Determine the template ID
        let templateId = "";
        if (labor.taskId === 3646) templateId = "FR1";
        else if (labor.taskId === 3648) templateId = "FR3";
        else if (labor.taskId === 3649) templateId = "FR4";
        else if (labor.taskId === 3650) templateId = "FR5";
        else if (associatedTask?.templateId) templateId = associatedTask.templateId;
        
        return {
          id: labor.id,
          laborId: labor.id,
          title: title,
          description: labor.taskDescription || (associatedTask?.description || null),
          startDate: labor.startDate,
          endDate: labor.endDate,
          status: "in_progress", // Default status for labor entries
          projectId: labor.projectId,
          hasLinkedLabor: true,
          templateId: templateId,
          tier1Category: labor.tier1Category,
          tier2Category: labor.tier2Category,
          totalHours: labor.totalHours || undefined, // Convert null to undefined
          fullName: labor.fullName,
          company: labor.company,
          isLaborRecord: true,
          taskId: labor.taskId || undefined
        };
      });
      
      console.log(`Converted ${items.length} labor records to GanttItems`);
      
      // Set the Gantt items
      setGanttItems(items);
    };
    
    // Execute the data fetching
    fetchAllData();
    
  }, [refreshTrigger]); // Refresh when the trigger changes
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4; // Only show 4 items at a time
  
  // Calculate total pages
  const totalPages = Math.ceil(ganttItems.length / itemsPerPage);
  
  // Get current items for this page
  const currentItems = ganttItems.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );
  
  // Functions to navigate between pages
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  console.log(`Gantt chart showing ${currentItems.length} of ${ganttItems.length} labor records (page ${currentPage + 1} of ${totalPages})`);
  
  // Use current date for the initial view
  const getCurrentDate = (): Date => {
    // Always use current date for the default view
    return new Date();
  };
  
  // State variables
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [selectedItem, setSelectedItem] = useState<GanttItem | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  // Use EditTaskDialogTask for taskToEdit state to match what EditTaskDialog expects
  const [taskToEdit, setTaskToEdit] = useState<EditTaskDialogTask | null>(null);
  
  // Create a 10-day view (default)
  const startDate = currentDate;
  const endDate = addDays(startDate, 9);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Navigation
  const goToPreviousPeriod = () => setCurrentDate((prevDate: Date) => subDays(prevDate, 10));
  const goToNextPeriod = () => setCurrentDate((prevDate: Date) => addDays(prevDate, 10));
  
  // Status colors - using the consolidated utilities
  const getStatusColor = (status: string) => {
    // Use the consolidated color utility functions but with a custom format for the Gantt chart
    const bgColorClass = getStatusBgColor(status);
    const borderColorClass = getStatusBorderColor(status);
    
    // Extract the color from border class and apply it to text
    const textColorClass = borderColorClass.replace('border-', 'text-');
    
    return `${bgColorClass} ${borderColorClass} ${textColorClass}`;
  };

  const calculateItemBar = (item: GanttItem) => {
    // Responsive column width
    const isMobile = window.innerWidth < 768;
    const columnWidth = isMobile ? 60 : 100; // Width of each day column in pixels - smaller on mobile
    
    // Safely parse dates
    const itemStart = safeParseDate(item.startDate);
    const itemEnd = safeParseDate(item.endDate);
    
    // Reset time components for accurate day-level comparisons
    const dayStart = new Date(days[0]);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(days[days.length - 1]);
    dayEnd.setHours(23, 59, 59, 999);
    
    const itemStartDay = new Date(itemStart);
    itemStartDay.setHours(0, 0, 0, 0);
    
    const itemEndDay = new Date(itemEnd);
    itemEndDay.setHours(0, 0, 0, 0);
    
    // Check if item is within visible date range
    // Item is visible if it ends after the start of view AND starts before the end of view
    const isVisible = itemEndDay >= dayStart && itemStartDay <= dayEnd;
    
    if (!isVisible) {
      return {
        left: 0,
        width: 0,
        isVisible: false
      };
    }
    
    // Calculate days from the start of the view
    const dayDiff = Math.floor((itemStartDay.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Position calculations
    let left = dayDiff * columnWidth;
    
    // Handle items starting before visible range
    if (dayDiff < 0) {
      left = 0;
    }
    
    // Calculate duration including both start and end days
    const durationDays = Math.floor((itemEndDay.getTime() - itemStartDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate width
    let width = durationDays * columnWidth;
    
    // Adjust width for items that start before visible range
    if (dayDiff < 0) {
      width = Math.max(width + (dayDiff * columnWidth), columnWidth);
    }
    
    // Ensure minimum width for visibility
    width = Math.max(width, columnWidth);
    
    return {
      left,
      width,
      isVisible
    };
  };

  const handleItemClick = (item: GanttItem) => {
    setSelectedItem(item);
  };

  const handleEditClick = () => {
    if (selectedItem && selectedItem.taskId) {
      // Find the associated task to edit
      const taskToEdit = taskMap[selectedItem.taskId];
      if (taskToEdit) {
        // Convert task to edit dialog format and open dialog
        const taskForEdit = {
          id: taskToEdit.id,
          title: taskToEdit.title,
          description: taskToEdit.description || "",
          status: taskToEdit.status,
          startDate: safeParseDate(taskToEdit.startDate).toISOString(),
          endDate: safeParseDate(taskToEdit.endDate).toISOString(),
          assignedTo: taskToEdit.assignedTo || "",
          projectId: taskToEdit.projectId,
          completed: taskToEdit.completed || false,
          category: taskToEdit.category,
          tier1Category: taskToEdit.tier1Category || "",
          tier2Category: taskToEdit.tier2Category || "",
          contactIds: taskToEdit.contactIds?.map(id => String(id)) || [],
          materialIds: taskToEdit.materialIds?.map(id => String(id)) || [],
          materialsNeeded: taskToEdit.materialsNeeded || "",
          templateId: taskToEdit.templateId || "",
          estimatedCost: taskToEdit.estimatedCost || null,
          actualCost: taskToEdit.actualCost || null
        };
        setTaskToEdit(taskForEdit);
        setEditTaskOpen(true);
      }
    }
  };

  // Determine if we're on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Effect to update mobile status on resize
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className={cn("pb-2 flex flex-col h-full", className)}>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={goToPreviousPeriod}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium text-xs md:text-base">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={goToNextPeriod}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Pagination controls */}
          <div className="flex items-center gap-1 mr-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={prevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium">
              {ganttItems.length > 0 ? (
                `${currentPage + 1} / ${totalPages}`
              ) : (
                "0 / 0"
              )}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1 || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {onAddTask && (
            <Button 
              onClick={onAddTask} 
              className="bg-project hover:bg-blue-600 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" /> 
              <span className="hidden md:inline">Add Labor</span>
              <span className="md:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Info message about labor records */}
      {ganttItems.length > 0 ? (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          <div className="flex items-center">
            <InfoIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <div>
              <span className="font-medium">Labor Timeline</span>: Showing {currentPage + 1} of {totalPages} pages ({currentItems.length} of {ganttItems.length} total labor records)
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
          <div className="flex items-center">
            <AlertTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <div>
              <span className="font-medium">No labor records found</span>: Add labor entries to tasks to see them in the timeline.
            </div>
          </div>
        </div>
      )}
      
      {/* Gantt Chart */}
      <div 
        className="border rounded-md w-full overflow-auto flex-1" 
        style={{ 
          minWidth: isMobile ? "800px" : "1000px",
          // Force full height when there are items
          height: ganttItems.length === 0 ? "200px" : "100%",
          maxHeight: "100%"
        }}>
        {/* Header - Days (Sticky) */}
        <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex-1 flex">
            {days.map((day, index) => (
              <div 
                key={index}
                className={cn(
                  `${isMobile ? 'w-[60px]' : 'w-[100px]'} flex-shrink-0 text-center py-2 text-sm border-r border-slate-200 last:border-r-0 flex flex-col justify-center`,
                  day.getDay() === 0 || day.getDay() === 6 
                    ? "bg-slate-100 text-slate-500"
                    : "text-slate-600"
                )}
              >
                <div className="font-medium">{format(day, isMobile ? 'E' : 'EEE')}</div>
                <div className="text-xl font-bold">{format(day, 'd')}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Labor Record Rows */}
        <div className="bg-white">
          {/* Show all labor records in the Gantt chart */}
          {currentItems
            .map((item) => {
              const { left, width, isVisible } = calculateItemBar(item);
              return isVisible ? { item, left, width } : null;
            })
            .filter(result => result !== null) // Remove items not in the current time frame
            .map(result => {
              const { item, left, width } = result!;
              const durationDays = differenceInDays(safeParseDate(item.endDate), safeParseDate(item.startDate)) + 1;
              
              return (
                <div 
                  key={item.id}
                  className="border-b border-slate-200 last:border-b-0 relative h-32 py-2"
                >
                  {/* Timeline with labor bar */}
                  <div 
                    className="absolute my-2 cursor-pointer"
                    style={{ 
                      left: `${left}px`, 
                      width: `${width}px`,
                      height: "24px", 
                      top: "0px"
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <div 
                      className={cn(
                        "h-28 rounded-md flex items-center justify-center px-4 py-3 transition-colors w-full",
                        "hover:brightness-95 shadow-lg border",
                        "bg-blue-100 border-blue-700 text-blue-800",
                        "border-l-8 border-blue-700"
                      )}
                    >
                      <div className="flex flex-col justify-center items-center w-full gap-2 p-2">
                        <div className="flex-1 text-center break-words" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          <div className="text-xs font-medium mb-1 bg-blue-200 inline-block px-2 py-0.5 rounded text-blue-800">
                            {item.templateId || (item.taskId ? `Task: ${item.taskId}` : 'Labor')}
                          </div>
                          <div className="text-md font-bold py-1" style={{ 
                              wordWrap: 'break-word',
                              whiteSpace: 'normal', 
                              maxHeight: '6rem',
                              overflow: 'visible',
                              width: '100%',
                              display: 'block',
                              textAlign: 'center',
                              lineHeight: '1.2'
                            }}>
                            {item.title}
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full text-xs mt-1">
                          <span>{format(safeParseDate(item.startDate), 'MMM d')} - {format(safeParseDate(item.endDate), 'MMM d')}</span>
                          <span className="font-semibold bg-blue-200 px-1 py-0.5 rounded text-xs">
                            {item.totalHours || 0} hrs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      
      {/* Labor Detail Dialog */}
      <Dialog 
        open={!!selectedItem && !editTaskOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]" aria-describedby="labor-details-description">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl">
                <div className="flex items-start gap-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-800 font-medium flex-shrink-0 mt-1">
                    {selectedItem?.templateId || `Labor ID: ${selectedItem?.id}`}
                  </span>
                  <span className="break-words" style={{ 
                    wordWrap: 'break-word', 
                    whiteSpace: 'normal', 
                    lineHeight: '1.3'
                  }}>
                    {selectedItem?.title || "Labor Details"}
                  </span>
                </div>
              </DialogTitle>
              
              {onUpdateTask && selectedItem && selectedItem.taskId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditClick}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" /> Edit Task
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {selectedItem && (
            <div className="py-4 space-y-4">
              {selectedItem.description && (
                <p className="text-sm text-slate-600" id="labor-details-description">
                  {selectedItem.description}
                </p>
              )}
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                  <div className="text-xs text-slate-500">Start Date</div>
                  <div className="text-sm font-medium">
                    {format(safeParseDate(selectedItem.startDate), 'dd MMM yyyy')}
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                  <div className="text-xs text-slate-500">End Date</div>
                  <div className="text-sm font-medium">
                    {format(safeParseDate(selectedItem.endDate), 'dd MMM yyyy')}
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                  <div className="text-xs text-slate-500">Hours</div>
                  <div className="text-sm font-medium">
                    {selectedItem.totalHours || 0} hrs
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <Briefcase className="h-4 w-4 text-muted-foreground mb-1" />
                  <div className="text-xs text-slate-500">Company</div>
                  <div className="text-sm font-medium">
                    {selectedItem.company || "Not specified"}
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground mb-1" />
                  <div className="text-xs text-slate-500">Contractor</div>
                  <div className="text-sm font-medium">
                    {selectedItem.fullName || "Not specified"}
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <Tag className="h-4 w-4 text-muted-foreground mb-1" />
                  <div className="text-xs text-slate-500">Category</div>
                  <div className="text-sm font-medium capitalize">
                    {selectedItem.tier1Category || "None"}
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <Tag className="h-4 w-4 text-muted-foreground mb-1" />
                  <div className="text-xs text-slate-500">Subcategory</div>
                  <div className="text-sm font-medium capitalize">
                    {selectedItem.tier2Category || "None"}
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                  <div className="text-xs text-slate-500">Duration</div>
                  <div className="text-sm font-medium">
                    {differenceInDays(
                      safeParseDate(selectedItem.endDate), 
                      safeParseDate(selectedItem.startDate)
                    ) + 1} days
                  </div>
                </div>
              </div>
              
              {/* Link to view all labor or the task */}
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedItem.taskId && (
                    <Link 
                      to={`/tasks/${selectedItem.taskId}`}
                      className="inline-flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-md"
                    >
                      <span>View Task Details</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  
                  <Link 
                    to={`/labor`}
                    className="inline-flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-md"
                  >
                    <span>View All Labor Records</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Task Dialog - only used when editing the associated task */}
      {taskToEdit && (
        <EditTaskDialog 
          task={taskToEdit}
          open={editTaskOpen}
          onOpenChange={(open) => {
            setEditTaskOpen(open);
            if (!open) {
              // Refresh the data after dialog closes
              setRefreshTrigger(prev => prev + 1);
              setSelectedItem(null);
            }
          }}
        />
      )}
    </div>
  );
}