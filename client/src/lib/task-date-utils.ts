import { parseISO, differenceInDays } from 'date-fns';

/**
 * Finds the task that is closest to the current date
 * @param tasks Array of tasks to search through
 * @param referenceDate The reference date to compare against (defaults to today)
 * @param timeframeDays Tasks outside this range (±days) will be filtered out (default ±7 days)
 * @returns The task closest to the current date, or undefined if no tasks are found
 */
export function findNearestTask(
  tasks: any[],
  referenceDate: Date = new Date(),
  timeframeDays: number = 7
): any | undefined {
  if (!tasks || tasks.length === 0) {
    return undefined;
  }

  // Filter tasks that have valid date fields
  const validTasks = tasks.filter(task => 
    task.startDate && task.endDate
  );

  if (validTasks.length === 0) {
    return undefined;
  }
  
  // Calculate the difference in days for each task
  const tasksWithDifference = validTasks.map(task => {
    const startDate = typeof task.startDate === 'string' 
      ? parseISO(task.startDate) 
      : task.startDate;
    
    const endDate = typeof task.endDate === 'string' 
      ? parseISO(task.endDate) 
      : task.endDate;
    
    // Calculate the midpoint between start and end dates
    const midpointTime = (startDate.getTime() + endDate.getTime()) / 2;
    const midpointDate = new Date(midpointTime);
    
    // Calculate difference between midpoint and reference date
    const difference = Math.abs(differenceInDays(midpointDate, referenceDate));
    
    return {
      task,
      difference,
      startDate,
      endDate,
      midpointDate
    };
  });
  
  // Filter tasks within the timeframe
  const tasksWithinTimeframe = tasksWithDifference.filter(
    ({ difference }) => difference <= timeframeDays
  );
  
  if (tasksWithinTimeframe.length === 0) {
    // If no tasks are within timeframe, return the closest task from all tasks
    return tasksWithDifference.sort((a, b) => a.difference - b.difference)[0].task;
  }
  
  // Return the task with the smallest difference (closest to current date)
  return tasksWithinTimeframe.sort((a, b) => a.difference - b.difference)[0].task;
}

/**
 * Determines if a task is active or upcoming based on its dates
 * @param task The task to check
 * @param referenceDate The reference date to compare against (defaults to today)
 * @param timeframeDays Tasks outside this range (±days) will not be considered active/upcoming
 * @returns Boolean indicating if the task is active or upcoming
 */
export function isTaskActiveOrUpcoming(
  task: any, 
  referenceDate: Date = new Date(),
  timeframeDays: number = 3
): boolean {
  if (!task || !task.startDate || !task.endDate) {
    return false;
  }
  
  const startDate = typeof task.startDate === 'string' 
    ? parseISO(task.startDate) 
    : task.startDate;
  
  const endDate = typeof task.endDate === 'string' 
    ? parseISO(task.endDate) 
    : task.endDate;
  
  // Calculate difference between start date and reference date
  const startDifference = differenceInDays(startDate, referenceDate);
  
  // Calculate difference between end date and reference date  
  const endDifference = differenceInDays(endDate, referenceDate);
  
  // Check if the task is within the timeframe
  // Task is active if:
  // 1. Reference date is between start and end dates, OR
  // 2. Start date is within timeframe days (upcoming), OR
  // 3. End date is within timeframe days (ending soon)
  
  const isActive = 
    // Reference date is between start and end
    (startDate <= referenceDate && referenceDate <= endDate) ||
    // Start date is close to reference date (upcoming)
    (startDifference > 0 && startDifference <= timeframeDays) ||
    // End date is close to reference date (ending soon)
    (endDifference < 0 && Math.abs(endDifference) <= timeframeDays);
  
  return isActive;
}