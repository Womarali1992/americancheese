import React, { useState, useEffect } from "react";
import { format, eachDayOfInterval, addDays, subDays, differenceInDays, parseISO, isValid, eachHourOfInterval, setHours, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { getStatusBgColor, getStatusBorderColor } from "@/lib/unified-color-system";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Clock, User, Tag, ChevronLeft, 
  ChevronRight, Plus, Edit, Info as InfoIcon,
  AlertTriangle as AlertTriangleIcon, ExternalLink,
  Briefcase
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

// Define a GanttTask interface that extends the schema Task type
interface Task extends SchemaTask {
  hasLinkedLabor?: boolean;
}

// Define LaborRecord interface for labor entries in the Gantt chart
interface LaborRecord extends SchemaLabor {
  taskTitle?: string; // From the linked task
  taskTemplateId?: string; // Template ID from the linked task (e.g., FR5)
}

// Define GanttTask for our Gantt chart component
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
    ganttItem.contactIds.map(id => String(id)) : 
    [];
    
  const stringMaterialIds = ganttItem.materialIds ? 
    ganttItem.materialIds.map(id => String(id)) : 
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
  onAddTask?: () => void;
  onUpdateTask?: (id: number, task: Partial<Task>) => void;
  viewPeriod?: 1 | 3 | 10;
}

export function GanttChart({
  className,
  onAddTask,
  onUpdateTask,
  viewPeriod = 10,
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
      const items: GanttItem[] = enhancedLaborRecords.map(labor => {
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
          tier1Category: labor.tier1Category || undefined,
          tier2Category: labor.tier2Category || undefined,
          totalHours: labor.totalHours || undefined, // Convert null to undefined if needed
          fullName: labor.fullName,
          company: labor.company,
          isLaborRecord: true,
          taskId: labor.taskId || undefined
        };
      });
      
      console.log(`Converted ${items.length} labor records to GanttItems`);
      
      // Debug logging for date range analysis
      if (items.length > 0) {
        const allDates = items.flatMap(item => [item.startDate, item.endDate]);
        console.log('All dates from labor records:', allDates);
        
        const parsedDates = allDates.map(date => safeParseDate(date));
        const earliestDate = new Date(Math.min(...parsedDates.map(d => d.getTime())));
        const latestDate = new Date(Math.max(...parsedDates.map(d => d.getTime())));
        
        console.log('Date range from labor records:', {
          earliest: earliestDate.toISOString().split('T')[0],
          latest: latestDate.toISOString().split('T')[0],
          span: Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        });
        
        // Debug specific July 15th records
        const july15Records = items.filter(item =>
          (typeof item.startDate === 'string' ? item.startDate : item.startDate.toString()).includes('2025-07-15') ||
          (typeof item.endDate === 'string' ? item.endDate : item.endDate.toString()).includes('2025-07-15')
        );
        console.log('July 15th labor records found:', july15Records.length);
        july15Records.forEach(record => {
          console.log(`July 15th record ID ${record.id}: ${record.title} (${record.startDate} to ${record.endDate})`);
        });
      }
      
      // Set the Gantt items
      setGanttItems(items);
    };
    
    // Execute the data fetching
    fetchAllData();
    
  }, [refreshTrigger]); // Refresh when the trigger changes
  
  // Calculate the optimal date range to show actual task data
  const getOptimalDateRange = (): { startDate: Date; endDate: Date } => {
    if (ganttItems.length === 0) {
      // If no items, use current date
      const currentDate = new Date();
      let startDate = currentDate;
      
      // For 3-day view, make today the middle day by starting 1 day before
      if (viewPeriod === 3) {
        startDate = subDays(currentDate, 1);
      }
      
      return {
        startDate: startDate,
        endDate: addDays(startDate, viewPeriod - 1)
      };
    }
    
    // Find the earliest and latest dates from all gantt items
    const allDates = ganttItems.flatMap(item => [
      safeParseDate(item.startDate),
      safeParseDate(item.endDate)
    ]);
    
    const earliestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const latestDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Reset time components for accurate day-level comparisons
    earliestDate.setHours(0, 0, 0, 0);
    latestDate.setHours(0, 0, 0, 0);
    
    // Calculate the span needed to show all tasks
    const spanDays = Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Start from the earliest date, but if that creates a view period where no items are visible,
    // adjust to start from today (which should show more recent items)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    
    // If the earliest date is too far in the past compared to today,
    // and there are items closer to today, start from today instead
    const daysSinceEarliest = Math.floor((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
    const hasRecentItems = allDates.some(date => {
      const itemDate = new Date(date.getTime());
      itemDate.setHours(0, 0, 0, 0);
      const daysFromToday = Math.floor((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return Math.abs(daysFromToday) <= viewPeriod / 2;
    });
    
    if (daysSinceEarliest > viewPeriod && hasRecentItems) {
      // Start from today to show more recent items
      // For 3-day view, make today the middle day by starting 1 day before
      if (viewPeriod === 3) {
        startDate = subDays(today, 1);
      } else {
        startDate = today;
      }
    } else {
      // Start from the earliest date
      startDate = earliestDate;
    }
    
    const endDate = addDays(startDate, viewPeriod - 1);
    
    // If the latest date is beyond our view period, we still start from earliest
    // Users can navigate to see more if needed
    console.log('Date range calculation:', {
      totalItems: ganttItems.length,
      earliestDate: earliestDate.toISOString().split('T')[0],
      latestDate: latestDate.toISOString().split('T')[0],
      spanDays,
      viewPeriod,
      calculatedStart: startDate.toISOString().split('T')[0],
      calculatedEnd: endDate.toISOString().split('T')[0]
    });
    
    // Debug: Show some sample dates from all items
    const sampleDates = ganttItems.slice(0, 5).map(item => ({
      id: item.id,
      title: item.title,
      startDate: item.startDate,
      endDate: item.endDate
    }));
    console.log('Sample dates from gantt items:', sampleDates);
    
    return {
      startDate: startDate,
      endDate: endDate
    };
  };
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4; // Only show 4 items at a time
  
  // Calculate date range first to determine which items should be visible
  const dateRange = ganttItems.length > 0 ? getOptimalDateRange() : { startDate: new Date(), endDate: new Date() };
  
  // Filter items by visibility within the current date range first
  const visibleItems = ganttItems.filter(item => {
    const itemStartDay = safeParseDate(item.startDate);
    const itemEndDay = safeParseDate(item.endDate);
    const dayStart = dateRange.startDate;
    const dayEnd = dateRange.endDate;
    
    // Reset time components for accurate day-level comparisons
    itemStartDay.setHours(0, 0, 0, 0);
    itemEndDay.setHours(0, 0, 0, 0);
    dayStart.setHours(0, 0, 0, 0);
    dayEnd.setHours(0, 0, 0, 0);
    
    // Item is visible if it ends after the start of view AND starts before the end of view
    return itemEndDay >= dayStart && itemStartDay <= dayEnd;
  });
  
  // Calculate total pages based on visible items
  const totalPages = Math.ceil(visibleItems.length / itemsPerPage);
  
  // Get current items for this page from visible items only
  const currentItems = visibleItems.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );
  
  // Reset page to 0 if current page is beyond available pages
  if (currentPage >= totalPages && totalPages > 0) {
    setCurrentPage(0);
  }
  
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
  
  console.log(`🔄 NEW PAGINATION: Showing ${currentItems.length} of ${visibleItems.length} visible records (out of ${ganttItems.length} total) (page ${currentPage + 1} of ${totalPages})`);
  
  // Debug current items being processed
  console.log('Current items on page:', currentItems.map(item => ({
    id: item.id,
    title: item.title,
    startDate: item.startDate,
    endDate: item.endDate
  })));
  
  // Debug all items to see July 15th records
  console.log('All gantt items:', ganttItems.map(item => ({
    id: item.id,
    title: item.title,
    startDate: item.startDate,
    endDate: item.endDate
  })));
  
  // Debug visible items after filtering
  console.log('Visible items:', visibleItems.map(item => ({
    id: item.id,
    title: item.title,
    startDate: item.startDate,
    endDate: item.endDate
  })));
  
  console.log(`Showing ${visibleItems.length} visible items out of ${ganttItems.length} total items`);
  
  // State variables
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedItem, setSelectedItem] = useState<GanttItem | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  // Use EditTaskDialogTask for taskToEdit state to match what EditTaskDialog expects
  const [taskToEdit, setTaskToEdit] = useState<EditTaskDialogTask | null>(null);
  
  // Update current date when gantt items change
  useEffect(() => {
    if (ganttItems.length > 0) {
      const optimalRange = getOptimalDateRange();
      setCurrentDate(optimalRange.startDate);
      
      // Debug logging for date range calculation
      console.log('Optimal date range calculated:', {
        startDate: optimalRange.startDate.toISOString().split('T')[0],
        endDate: optimalRange.endDate.toISOString().split('T')[0],
        itemCount: ganttItems.length,
        viewPeriod: viewPeriod
      });
    }
  }, [ganttItems, viewPeriod]);
  
  // Create dynamic view based on selected period
  const currentDateRange = currentDate ? {
    startDate: currentDate,
    endDate: addDays(currentDate, viewPeriod - 1)
  } : getOptimalDateRange();
  
  const startDate = currentDateRange.startDate;
  const endDate = currentDateRange.endDate;
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Navigation - adapt to current view period
  const goToPreviousPeriod = () => setCurrentDate((prevDate: Date | null) => prevDate ? subDays(prevDate, viewPeriod) : new Date());
  const goToNextPeriod = () => setCurrentDate((prevDate: Date | null) => prevDate ? addDays(prevDate, viewPeriod) : new Date());
  
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
    // Use percentage-based calculations for responsive width
    const totalColumns = viewPeriod === 1 ? 24 : viewPeriod;
    const columnWidthPercent = 100 / totalColumns;
    
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
    
    // Debug logging for date range visibility
    console.log(`Labor item ${item.id} (${item.title}):`, {
      itemStart: itemStartDay.toISOString().split('T')[0],
      itemEnd: itemEndDay.toISOString().split('T')[0],
      viewStart: dayStart.toISOString().split('T')[0],
      viewEnd: dayEnd.toISOString().split('T')[0],
      viewPeriod: viewPeriod,
      isVisible
    });
    
    // Special logging for July 15th records
    if ((typeof item.startDate === 'string' && item.startDate.includes('2025-07-15')) ||
        (typeof item.endDate === 'string' && item.endDate.includes('2025-07-15'))) {
      console.log(`🔍 July 15th record ${item.id} visibility check:`, {
        itemStart: itemStartDay.toISOString().split('T')[0],
        itemEnd: itemEndDay.toISOString().split('T')[0],
        viewStart: dayStart.toISOString().split('T')[0],
        viewEnd: dayEnd.toISOString().split('T')[0],
        isVisible,
        itemEndAfterViewStart: itemEndDay >= dayStart,
        itemStartBeforeViewEnd: itemStartDay <= dayEnd
      });
    }
    
    if (!isVisible) {
      return {
        left: 0,
        width: 0,
        isVisible: false
      };
    }
    
    // Calculate position based on view type
    let left, width;

    if (viewPeriod === 1) {
      // Hour-based calculations for day view
      const dayStartTime = startOfDay(dayStart);
      const hoursDiff = (itemStart.getTime() - dayStartTime.getTime()) / (1000 * 60 * 60);
      const durationHours = (itemEnd.getTime() - itemStart.getTime()) / (1000 * 60 * 60);

      // Use totalHours if available and reliable, otherwise fall back to date calculation
      const actualDurationHours = (item.totalHours && item.totalHours > 0) ? item.totalHours : Math.abs(durationHours);

      // Debug logging for hour calculations
      console.log(`Task ${item.id}: Start=${itemStart.toISOString()}, End=${itemEnd.toISOString()}, DateDurationHours=${durationHours}, TotalHours=${item.totalHours}, ActualDurationUsed=${actualDurationHours}, HoursDiff=${hoursDiff}`);

      left = Math.max(0, hoursDiff * columnWidthPercent);
      // Use the totalHours field if available, otherwise fall back to date calculation
      width = Math.max(columnWidthPercent, actualDurationHours * columnWidthPercent);

      // Adjust for items that extend beyond the day
      if (hoursDiff < 0) {
        const visibleHours = Math.min(actualDurationHours, actualDurationHours + hoursDiff); // How many hours are visible in current day
        width = Math.max(columnWidthPercent, visibleHours * columnWidthPercent);
        left = 0;
      }
      if (hoursDiff + actualDurationHours > 24) {
        const visibleHours = 24 - Math.max(0, hoursDiff);
        width = visibleHours * columnWidthPercent;
      }
    } else {
      // Day-based calculations for multi-day views
      const dayDiff = Math.floor((itemStartDay.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24));

      // Position calculations
      left = dayDiff * columnWidthPercent;

      // Handle items starting before visible range
      if (dayDiff < 0) {
        left = 0;
      }

      // Calculate duration including both start and end days
      const durationDays = Math.floor((itemEndDay.getTime() - itemStartDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Calculate width
      width = durationDays * columnWidthPercent;

      // Adjust width for items that start before visible range
      if (dayDiff < 0) {
        width = Math.max(width + (dayDiff * columnWidthPercent), columnWidthPercent);
      }

      // Ensure minimum width for visibility
      width = Math.max(width, columnWidthPercent);
    }
    
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
          category: taskToEdit.category || "",
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
  
  // Render navigation controls in header using portal
  useEffect(() => {
    const container = document.getElementById('gantt-controls-container');
    if (container) {
      const controlsHtml = `
        <div class="flex items-center space-x-2">
          <button class="gantt-prev-period inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span class="text-sm font-medium">
            ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}
          </span>
          <button class="gantt-next-period inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          
          <div class="flex items-center space-x-1 ml-4">
            <button class="gantt-period-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-2 text-xs ${viewPeriod === 1 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'}">
              1D
            </button>
            <button class="gantt-period-3 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-2 text-xs ${viewPeriod === 3 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'}">
              3D
            </button>
            <button class="gantt-period-10 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-2 text-xs ${viewPeriod === 10 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'}">
              10D
            </button>
          </div>
        </div>
      `;
      container.innerHTML = controlsHtml;
      
      // Add event listeners
      const prevBtn = container.querySelector('.gantt-prev-period');
      const nextBtn = container.querySelector('.gantt-next-period');
      const period1Btn = container.querySelector('.gantt-period-1');
      const period3Btn = container.querySelector('.gantt-period-3');
      const period10Btn = container.querySelector('.gantt-period-10');
      
      if (prevBtn) prevBtn.addEventListener('click', goToPreviousPeriod);
      if (nextBtn) nextBtn.addEventListener('click', goToNextPeriod);
      // Note: period buttons should be handled by parent component

      // Cleanup function
      return () => {
        if (prevBtn) prevBtn.removeEventListener('click', goToPreviousPeriod);
        if (nextBtn) nextBtn.removeEventListener('click', goToNextPeriod);
      };
    }
  }, [startDate, endDate, viewPeriod, goToPreviousPeriod, goToNextPeriod]);

  return (
    <div className={cn("pb-2 flex flex-col h-full", className)}>
      <div className="mb-4 flex justify-end items-center">
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
              <span className="font-medium">Labor Timeline</span>: Showing {currentPage + 1} of {totalPages} pages ({currentItems.length} of {visibleItems.length} visible records, {ganttItems.length} total)
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
        {/* Header - Days or Hours (Sticky) */}
        <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex-1 flex w-full">
            {viewPeriod === 1 ? (
              // Show hourly breakdown for day view
              (() => {
                const currentDay = days[0];
                const hours = eachHourOfInterval({
                  start: startOfDay(currentDay),
                  end: endOfDay(currentDay)
                });

                return hours.map((hour, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 text-center py-2 text-xs border-r border-slate-200 last:border-r-0 flex flex-col justify-center min-w-0",
                      hour.getHours() < 8 || hour.getHours() > 17
                        ? "bg-slate-100 text-slate-500" // Non-business hours
                        : "text-slate-600"
                    )}
                  >
                    <div className="font-medium">{format(hour, 'ha')}</div>
                    {index === 0 && (
                      <div className="text-xs text-slate-500">{format(currentDay, 'MMM d')}</div>
                    )}
                  </div>
                ));
              })()
            ) : (
              // Show daily breakdown for multi-day views
              days.map((day, index) => {
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 text-center py-2 text-sm border-r border-slate-200 last:border-r-0 flex flex-col justify-center min-w-0",
                      day.getDay() === 0 || day.getDay() === 6
                        ? "bg-slate-100 text-slate-500"
                        : "text-slate-600"
                    )}
                  >
                    <div className="font-medium">{format(day, isMobile ? 'E' : 'EEE')}</div>
                    <div className="text-xl font-bold">{format(day, 'd')}</div>
                  </div>
                );
              })
            )}
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
                      left: `${left}%`,
                      width: `${width}%`,
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
                    to={`/contacts?tab=labor`}
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
          open={editTaskOpen}
          onOpenChange={(open) => {
            setEditTaskOpen(open);
            if (!open) {
              setTaskToEdit(null);
              setSelectedItem(null);
            }
          }}
          // Cast to any to resolve type conflict between different Task interfaces
          task={taskToEdit as any}
        />
      )}
    </div>
  );
}