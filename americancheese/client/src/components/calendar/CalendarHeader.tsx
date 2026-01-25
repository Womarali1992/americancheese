import { format, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutList, GanttChart } from "lucide-react";

export type CalendarView = "day" | "week" | "month" | "gantt";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onPrevious,
  onNext,
  onToday,
  onViewChange
}: CalendarHeaderProps) {
  const getDisplayDate = () => {
    if (view === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    }
    if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    }
    // Week view - show date range
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "d, yyyy")}`;
    }
    return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevious}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="h-8"
        >
          Today
        </Button>
        <h2 className="text-lg font-semibold text-gray-900 ml-2">
          {getDisplayDate()}
        </h2>
      </div>

      {/* Right: View Toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <Button
          variant={view === "day" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("day")}
          className={`h-7 px-3 ${
            view === "day"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <LayoutList className="h-4 w-4 mr-1.5" />
          Day
        </Button>
        <Button
          variant={view === "week" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("week")}
          className={`h-7 px-3 ${
            view === "week"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <CalendarIcon className="h-4 w-4 mr-1.5" />
          Week
        </Button>
        <Button
          variant={view === "month" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("month")}
          className={`h-7 px-3 ${
            view === "month"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <CalendarIcon className="h-4 w-4 mr-1.5" />
          Month
        </Button>
        <Button
          variant={view === "gantt" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("gantt")}
          className={`h-7 px-3 ${
            view === "gantt"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <GanttChart className="h-4 w-4 mr-1.5" />
          Gantt
        </Button>
      </div>
    </div>
  );
}
