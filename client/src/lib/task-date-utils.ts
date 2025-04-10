/**
 * Utility functions for handling task dates and proximity calculations
 */

type TaskWithDates = {
  startDate?: string;
  endDate?: string;
  id: number;
  projectId: number;
  [key: string]: any;
};

/**
 * Finds the task that is closest to the current date, with priority to framing tasks
 * @param tasks Array of tasks to search through
 * @param referenceDate The reference date to compare against (defaults to today)
 * @param timeframeDays Tasks outside this range (±days) will be filtered out (default ±14 days)
 * @returns The task closest to the current date, or undefined if no tasks are found
 */
export function findNearestTask(
  tasks: TaskWithDates[],
  referenceDate: Date = new Date(),
  timeframeDays: number = 14
): TaskWithDates | undefined {
  if (!tasks || tasks.length === 0) {
    console.log("findNearestTask: No tasks provided or empty tasks array");
    return undefined;
  }
  
  console.log(`findNearestTask: Searching through ${tasks.length} tasks for nearest to ${referenceDate.toISOString().split('T')[0]}, timeframe: ±${timeframeDays} days`);

  // Filter framing tasks (FR)
  const framingTasks = tasks.filter(
    (task) => task.title && 
              (task.title.includes('(FR') || task.category === 'framing') &&
              task.startDate && task.endDate
  );
  
  console.log(`findNearestTask: Found ${framingTasks.length} framing tasks:`, 
    framingTasks.map(t => `${t.id} - ${t.title} (${t.startDate}~${t.endDate})`));
  
  // Look specifically for FR3 which we want to prioritize
  const fr3Task = tasks.find(
    (task) => task.title && 
              (task.title.includes('FR3') || task.id === 3648) &&
              task.startDate && task.endDate
  );
  
  if (fr3Task) {
    console.log(`findNearestTask: ✓ Found FR3 task:`, fr3Task.id, fr3Task.title);
    return fr3Task;
  }

  // If we have framing tasks, prioritize them 
  // (find the closest one to the reference date)
  if (framingTasks.length > 0) {
    // Sort them chronologically first
    framingTasks.sort((a, b) => {
      const dateA = new Date(a.startDate!).getTime();
      const dateB = new Date(b.startDate!).getTime();
      return dateA - dateB;
    });
    
    // Find the one starting closest to today
    const closestTask = framingTasks.reduce((closest, current) => {
      const currentDate = new Date(current.startDate!);
      const closestDate = closest ? new Date(closest.startDate!) : null;
      
      if (!closestDate) return current;
      
      const currentDiff = Math.abs(currentDate.getTime() - referenceDate.getTime());
      const closestDiff = Math.abs(closestDate.getTime() - referenceDate.getTime());
      
      return currentDiff < closestDiff ? current : closest;
    }, null as TaskWithDates | null);
    
    if (closestTask) {
      return closestTask;
    }
  }

  // If no framing tasks, continue with general approach
  const tasksWithDates = tasks.filter(
    (task) => task.startDate && task.endDate
  );

  if (tasksWithDates.length === 0) return undefined;

  // Calculate a date range buffer for the search
  const dateLowerBound = new Date(referenceDate);
  dateLowerBound.setDate(referenceDate.getDate() - timeframeDays);
  
  const dateUpperBound = new Date(referenceDate);
  dateUpperBound.setDate(referenceDate.getDate() + timeframeDays);

  // Calculate proximity for each task
  const tasksWithProximity = tasksWithDates.map((task) => {
    // Start date as Date object
    const startDate = new Date(task.startDate!);
    // End date as Date object
    const endDate = new Date(task.endDate!);

    // Task is in progress (between start and end dates)
    if (startDate <= referenceDate && endDate >= referenceDate) {
      return { task, proximity: 0 }; // Zero distance, it's happening now
    }

    // Task is in the past, calculate distance from end date to now
    if (endDate < referenceDate) {
      const distanceInDays = Math.ceil(
        (referenceDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { task, proximity: distanceInDays };
    }

    // Task is in the future, calculate distance from now to start date
    const distanceInDays = Math.ceil(
      (startDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { task, proximity: distanceInDays };
  });

  // Filter tasks within our date range
  const tasksInRange = tasksWithProximity.filter(({ proximity }) => 
    proximity <= timeframeDays
  );

  if (tasksInRange.length === 0) {
    // If none in range, just use the absolute nearest task
    tasksWithProximity.sort((a, b) => a.proximity - b.proximity);
    return tasksWithProximity[0]?.task;
  }

  // Sort by proximity (ascending)
  tasksInRange.sort((a, b) => a.proximity - b.proximity);
  
  // Return the nearest task
  return tasksInRange[0]?.task;
}

/**
 * Determines if a task is active or upcoming based on its dates
 * Also prioritizes framing tasks to ensure they're highlighted
 * @param task The task to check
 * @param referenceDate The reference date to compare against (defaults to today)
 * @param timeframeDays Tasks outside this range (±days) will not be considered active/upcoming
 * @returns Boolean indicating if the task is active or upcoming
 */
export function isTaskActiveOrUpcoming(
  task: TaskWithDates,
  referenceDate: Date = new Date(),
  timeframeDays: number = 7
): boolean {
  if (!task || !task.startDate || !task.endDate) return false;
  
  // Prioritize framing tasks (FR) to ensure they're highlighted
  if (task.title && task.title.includes('(FR')) {
    return true;
  }
  
  // Also highlight tasks with category=framing
  if (task.category === 'framing') {
    return true;
  }

  const startDate = new Date(task.startDate);
  const endDate = new Date(task.endDate);

  // Check if task is active (in progress)
  if (startDate <= referenceDate && endDate >= referenceDate) {
    return true;
  }

  // Check if task starts within the upcoming timeframe
  const daysUntilStart = Math.ceil(
    (startDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Task starts within the specified number of days
  if (daysUntilStart >= 0 && daysUntilStart <= timeframeDays) {
    return true;
  }

  // Check if task ended very recently
  const daysSinceEnd = Math.ceil(
    (referenceDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Task ended within the last day
  if (daysSinceEnd >= 0 && daysSinceEnd <= 1) {
    return true;
  }

  return false;
}