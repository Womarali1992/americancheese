export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "border-[#7E6551]"; // brown
    case "on_hold":
      return "border-[#938581]"; // taupe
    case "delayed":
      return "border-[#8896AB]"; // slate
    default:
      return "border-[#466362]"; // teal
  }
}

export function getStatusBgColor(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-[#7E6551] bg-opacity-20 text-[#7E6551]";
    case "on_hold":
      return "bg-[#938581] bg-opacity-20 text-[#938581]";
    case "delayed":
      return "bg-[#8896AB] bg-opacity-20 text-[#8896AB]";
    default:
      return "bg-[#466362] bg-opacity-20 text-[#466362]";
  }
}

export function getProgressColor(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-[#7E6551] h-2 rounded-full";
    case "in_progress":
    case "in progress":
      return "bg-[#C5D5E4] h-2 rounded-full"; // Added new color for in progress
    case "not_started":
    case "not started":
    case "pending":
      return "bg-[#938581] h-2 rounded-full"; // Added new color for pending
    case "delayed":
    case "on_hold":
    case "on hold":
      return "bg-[#8896AB] h-2 rounded-full";
    default:
      return "bg-[#466362] h-2 rounded-full";
  }
}

export function formatTaskStatus(status: string): string {
  // Special case mapping to match the provided example
  const statusMap: Record<string, string> = {
    "completed": "Completed",
    "in_progress": "In Progress",
    "not_started": "Pending",
    "pending": "Pending",
    "delayed": "Delayed",
    "on_hold": "On Hold"
  };

  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');

  for (const [key, value] of Object.entries(statusMap)) {
    if (key.replace(/[_\s]/g, '') === normalizedStatus) {
      return value;
    }
  }

  // Fallback to standard formatting if no match
  return status
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}