import { Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskTimeDisplayProps {
  startTime?: string | null;
  endTime?: string | null;
  className?: string;
  compact?: boolean;
  showIcon?: boolean;
}

/**
 * Formats a time string from "HH:MM" to a more readable format like "9:00 AM"
 */
function formatTime(time: string | null | undefined): string {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Formats a time string from "HH:MM" to compact format like "4pm"
 */
function formatTime12h(time: string | null | undefined): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time;

  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  // Only show minutes if they're not :00
  if (minutes === 0) {
    return `${hour12}${period}`;
  }
  return `${hour12}:${minutes.toString().padStart(2, "0")}${period}`;
}

/**
 * Formats the calendar schedule prefix (e.g., "4pm Fri Feb 14,")
 */
export function getCalendarSchedulePrefix(
  calendarStartDate?: string | null,
  calendarStartTime?: string | null
): string {
  if (!calendarStartDate) return "";

  try {
    const date = parseISO(calendarStartDate);
    const timeStr = formatTime12h(calendarStartTime);
    const dateStr = format(date, "EEE MMM d"); // "Fri Feb 14"

    if (timeStr) {
      return `${timeStr} ${dateStr},`;
    }
    return `${dateStr},`;
  } catch {
    return "";
  }
}

/**
 * A sticky time display component that shows task time alongside the title.
 * Use this component wherever task titles are displayed to make time visible.
 */
export function TaskTimeDisplay({
  startTime,
  endTime,
  className,
  compact = false,
  showIcon = true
}: TaskTimeDisplayProps) {
  // Don't render anything if no time is set
  if (!startTime && !endTime) {
    return null;
  }

  const formattedStart = formatTime(startTime);
  const formattedEnd = formatTime(endTime);

  // If only start time exists
  if (formattedStart && !formattedEnd) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-muted-foreground",
          compact ? "text-[10px]" : "text-xs",
          className
        )}
      >
        {showIcon && <Clock className={cn("flex-shrink-0", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />}
        <span>{formattedStart}</span>
      </span>
    );
  }

  // If only end time exists
  if (!formattedStart && formattedEnd) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-muted-foreground",
          compact ? "text-[10px]" : "text-xs",
          className
        )}
      >
        {showIcon && <Clock className={cn("flex-shrink-0", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />}
        <span>until {formattedEnd}</span>
      </span>
    );
  }

  // Both times exist - show range
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-muted-foreground",
        compact ? "text-[10px]" : "text-xs",
        className
      )}
    >
      {showIcon && <Clock className={cn("flex-shrink-0", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />}
      <span>{formattedStart} - {formattedEnd}</span>
    </span>
  );
}

/**
 * A combined title and time display for task headers.
 * Shows the title with time badge inline.
 * When calendarStartDate is provided, shows the schedule prefix (e.g., "4pm Fri Feb 14, Task Title")
 */
interface TaskTitleWithTimeProps {
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  calendarStartDate?: string | null;
  calendarStartTime?: string | null;
  className?: string;
  titleClassName?: string;
  compact?: boolean;
}

export function TaskTitleWithTime({
  title,
  startTime,
  endTime,
  calendarStartDate,
  calendarStartTime,
  className,
  titleClassName,
  compact = false
}: TaskTitleWithTimeProps) {
  const hasTime = startTime || endTime;
  const schedulePrefix = getCalendarSchedulePrefix(calendarStartDate, calendarStartTime);

  // If we have a calendar schedule prefix, show it before the title
  if (schedulePrefix) {
    return (
      <div className={cn("flex items-center gap-1 min-w-0", className)}>
        <span className="font-semibold text-cyan-700 flex-shrink-0">{schedulePrefix}</span>
        <span className={cn("truncate", titleClassName)}>{title}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <span className={cn("truncate", titleClassName)}>{title}</span>
      {hasTime && (
        <TaskTimeDisplay
          startTime={startTime}
          endTime={endTime}
          compact={compact}
          className="flex-shrink-0"
        />
      )}
    </div>
  );
}
