/**
 * Utility functions for handling task dates and proximity calculations
 */

type TaskWithDates = {
  startDate?: string;
  endDate?: string;
  id: number;
  [key: string]: any;
};

/**
 * Finds the task that is closest to the current date
 * @param tasks Array of tasks to search through
 * @param referenceDate The reference date to compare against (defaults to today)
 * @param timeframeDays Tasks outside this range (±days) will be filtered out (default ±7 days)
 * @returns The task closest to the current date, or undefined if no tasks are found
 */
export function findNearestTask(
  tasks: TaskWithDates[],
  referenceDate: Date = new Date(),
  timeframeDays: number = 7
): TaskWithDates | undefined {
  if (!tasks || tasks.length === 0) return undefined;

  // Filter out tasks without proper dates
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
 * @param task The task to check
 * @param referenceDate The reference date to compare against (defaults to today)
 * @param timeframeDays Tasks outside this range (±days) will not be considered active/upcoming
 * @returns Boolean indicating if the task is active or upcoming
 */
export function isTaskActiveOrUpcoming(
  task: TaskWithDates,
  referenceDate: Date = new Date(),
  timeframeDays: number = 3
): boolean {
  if (!task || !task.startDate || !task.endDate) return false;

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